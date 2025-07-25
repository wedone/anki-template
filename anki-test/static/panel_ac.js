// AnkiConnect 面板脚本（开发中）

let selectedDeckPath = '';
window._acDecks = null; // 牌组缓存
window._acCardIds = {}; // 卡片ID缓存，key为deck名
window._acCardInfo = {}; // 卡片内容缓存，key为cardId
window._ankiSelectedCardId = null;

function buildDeckTree(deckNames) {
  const root = {};
  for (const name of deckNames) {
    const parts = name.split('::');
    let node = root;
    for (const part of parts) {
      if (!node[part]) node[part] = {};
      node = node[part];
    }
  }
  return root;
}

function renderDeckTree(node, path = '', level = 0) {
  let html = '<ul style="list-style:none;padding-left:18px;">';
  for (const key in node) {
    const fullPath = path ? path + '::' + key : key;
    const hasChildren = Object.keys(node[key]).length > 0;
    html += `<li>
      <span class="deck-toggle" data-path="${fullPath}" style="cursor:pointer;user-select:none;">
        <span class="toggle-icon">${level === 0 ? '-' : '+'}</span> <span class="deck-name" data-path="${fullPath}">${key}</span>
      </span>
      <div class="deck-children" style="display:${level === 0 ? '' : 'none'};">
        ${hasChildren ? renderDeckTree(node[key], fullPath, level + 1) : ''}
      </div>
    </li>`;
  }
  html += '</ul>';
  return html;
}

function bindDeckTreeToggle() {
  document.querySelectorAll('.deck-toggle').forEach(span => {
    span.onclick = function(e) {
      if (e.target.classList.contains('deck-name')) {
        document.querySelectorAll('.deck-name').forEach(n => n.style.background = '');
        e.target.style.background = '#e3f2fd';
        selectedDeckPath = e.target.getAttribute('data-path');
        e.stopPropagation();
        return;
      }
      const icon = this.querySelector('.toggle-icon');
      const children = this.parentNode.querySelector('.deck-children');
      if (!children) return;
      if (children.style.display === 'none') {
        children.style.display = '';
        icon.textContent = '-';
      } else {
        children.style.display = 'none';
        icon.textContent = '+';
      }
    };
  });
}

// 读取牌组（优先缓存）
document.getElementById('acReadDecksBtn').onclick = async function() {
  if (window._acDecks) {
    const tree = buildDeckTree(window._acDecks);
    document.getElementById('acContent').innerHTML = '<b>牌组树：</b>' + renderDeckTree(tree);
    bindDeckTreeToggle();
    selectedDeckPath = '';
    return;
  }
  document.getElementById('acContent').textContent = '正在获取牌组...';
  try {
    const res = await fetch('/anki/decks');
    const data = await res.json();
    const decks = Array.isArray(data) ? data : (data.result || []);
    window._acDecks = decks;
    const tree = buildDeckTree(decks);
    document.getElementById('acContent').innerHTML = '<b>牌组树：</b>' + renderDeckTree(tree);
    bindDeckTreeToggle();
    selectedDeckPath = '';
  } catch (e) {
    document.getElementById('acContent').textContent = '获取牌组失败：' + e;
  }
};
// 刷新牌组

document.getElementById('acRefreshDecksBtn').onclick = async function() {
  document.getElementById('acContent').textContent = '正在刷新牌组...';
  try {
    const res = await fetch('/anki/decks');
    const data = await res.json();
    const decks = Array.isArray(data) ? data : (data.result || []);
    window._acDecks = decks;
    const tree = buildDeckTree(decks);
    document.getElementById('acContent').innerHTML = '<b>牌组树：</b>' + renderDeckTree(tree);
    bindDeckTreeToggle();
    selectedDeckPath = '';
  } catch (e) {
    document.getElementById('acContent').textContent = '刷新牌组失败：' + e;
  }
};

// 读取卡片ID（优先缓存）
document.getElementById('acReadCardIdsBtn').onclick = async function() {
  if (!selectedDeckPath) {
    document.getElementById('acContent').textContent = '请先点击选择一个牌组';
    return;
  }
  if (window._acCardIds[selectedDeckPath]) {
    renderCardIdList(window._acCardIds[selectedDeckPath]);
    return;
  }
  document.getElementById('acContent').textContent = '正在获取牌组卡片ID...';
  try {
    const quotedDeck = `"${selectedDeckPath.replace(/"/g, '\"')}"`;
    const res = await fetch(`/anki/cards?deck=${encodeURIComponent(quotedDeck)}`);
    const data = await res.json();
    let cardIds = [];
    if (data.result && Array.isArray(data.result)) {
      cardIds = data.result;
    } else if (Array.isArray(data)) {
      cardIds = data;
    }
    if (!cardIds.length) {
      document.getElementById('acContent').textContent = '该牌组没有卡片';
      window._acCardIds[selectedDeckPath] = [];
      window._ankiSelectedCardId = null;
      return;
    }
    window._acCardIds[selectedDeckPath] = cardIds;
    renderCardIdList(cardIds);
  } catch (e) {
    document.getElementById('acContent').textContent = '获取卡片ID失败：' + e;
    window._acCardIds[selectedDeckPath] = [];
    window._ankiSelectedCardId = null;
  }
};
// 刷新卡片ID

document.getElementById('acRefreshCardIdsBtn').onclick = async function() {
  if (!selectedDeckPath) {
    document.getElementById('acContent').textContent = '请先点击选择一个牌组';
    return;
  }
  document.getElementById('acContent').textContent = '正在刷新卡片ID...';
  try {
    const quotedDeck = `"${selectedDeckPath.replace(/"/g, '\"')}"`;
    const res = await fetch(`/anki/cards?deck=${encodeURIComponent(quotedDeck)}`);
    const data = await res.json();
    let cardIds = [];
    if (data.result && Array.isArray(data.result)) {
      cardIds = data.result;
    } else if (Array.isArray(data)) {
      cardIds = data;
    }
    if (!cardIds.length) {
      document.getElementById('acContent').textContent = '该牌组没有卡片';
      window._acCardIds[selectedDeckPath] = [];
      window._ankiSelectedCardId = null;
      return;
    }
    window._acCardIds[selectedDeckPath] = cardIds;
    renderCardIdList(cardIds);
  } catch (e) {
    document.getElementById('acContent').textContent = '刷新卡片ID失败：' + e;
    window._acCardIds[selectedDeckPath] = [];
    window._ankiSelectedCardId = null;
  }
};

function renderCardIdList(cardIds) {
  document.getElementById('acContent').innerHTML = `<b>牌组「${selectedDeckPath}」的卡片ID：</b><br><div id='ankiCardIdList' style='max-height:300px;overflow:auto;'>` +
    cardIds.map(id => `<span class='anki-card-id' data-id='${id}' style='display:inline-block;margin:2px 6px;cursor:pointer;border-radius:4px;padding:2px 6px;'>${id}</span>`).join('') +
    '</div>';
  window._ankiSelectedCardId = null;
  setTimeout(() => {
    document.querySelectorAll('.anki-card-id').forEach(span => {
      span.onclick = function() {
        document.querySelectorAll('.anki-card-id').forEach(s => s.style.background = '');
        this.style.background = '#e3f2fd';
        window._ankiSelectedCardId = this.getAttribute('data-id');
      };
    });
  }, 0);
}

// 读取卡片内容（优先缓存）
document.getElementById('acReadCardInfoBtn').onclick = async function() {
  if (!selectedDeckPath) {
    document.getElementById('acContent').textContent = '请先点击选择一个牌组';
    return;
  }
  const cardId = window._ankiSelectedCardId;
  if (!cardId) {
    document.getElementById('acContent').textContent = '请先点击选择一个卡片ID';
    return;
  }
  if (window._acCardInfo[cardId]) {
    renderCardInfo(window._acCardInfo[cardId]);
    return;
  }
  document.getElementById('acContent').textContent = '正在获取卡片详细内容...';
  try {
    const infoRes = await fetch(`/anki/cards_info?ids=${cardId}`);
    const infoData = await infoRes.json();
    if (infoData.result && Array.isArray(infoData.result) && infoData.result.length) {
      const card = infoData.result[0];
      window._acCardInfo[cardId] = card;
      renderCardInfo(card);
    } else {
      document.getElementById('acContent').textContent = '未获取到卡片详情或格式异常';
    }
  } catch (e) {
    document.getElementById('acContent').textContent = '获取卡片详情失败：' + e;
  }
};
// 刷新卡片内容

document.getElementById('acRefreshCardInfoBtn').onclick = async function() {
  if (!selectedDeckPath) {
    document.getElementById('acContent').textContent = '请先点击选择一个牌组';
    return;
  }
  const cardId = window._ankiSelectedCardId;
  if (!cardId) {
    document.getElementById('acContent').textContent = '请先点击选择一个卡片ID';
    return;
  }
  document.getElementById('acContent').textContent = '正在刷新卡片内容...';
  try {
    const infoRes = await fetch(`/anki/cards_info?ids=${cardId}`);
    const infoData = await infoRes.json();
    if (infoData.result && Array.isArray(infoData.result) && infoData.result.length) {
      const card = infoData.result[0];
      window._acCardInfo[cardId] = card;
      renderCardInfo(card);
    } else {
      document.getElementById('acContent').textContent = '未获取到卡片详情或格式异常';
    }
  } catch (e) {
    document.getElementById('acContent').textContent = '刷新卡片详情失败：' + e;
  }
};

function renderCardInfo(card) {
  let html = `<b>卡片ID: ${card.cardId}</b><br>`;
  html += `<div style='color:#888;font-size:13px;'>模型: ${card.modelName} | 牌组: ${card.deckName}</div>`;
  html += `<div style='margin:6px 0;'><b>正面：</b><div style='background:#f8f8f8;padding:6px 10px;border-radius:4px;'>${card.question}</div></div>`;
  html += `<div style='margin:6px 0;'><b>背面：</b><div style='background:#f8f8f8;padding:6px 10px;border-radius:4px;'>${card.answer}</div></div>`;
  if (card.fields) {
    html += `<details open><summary style='cursor:pointer;'>字段详情</summary><ul style='font-size:13px;'>`;
    for (const fname in card.fields) {
      html += `<li><b>${fname}:</b> ${card.fields[fname].value}</li>`;
    }
    html += `</ul></details>`;
  }
  document.getElementById('acContent').innerHTML = html;
}

// 清空内容

document.getElementById('acClearBtn').onclick = function() {
  document.getElementById('acContent').textContent = '清空内容（占位）';
};
// 清空缓存

document.getElementById('acClearCacheBtn').onclick = function() {
  window._acDecks = null;
  window._acCardIds = {};
  window._acCardInfo = {};
  window._ankiSelectedCardId = null;
  document.getElementById('acContent').textContent = '缓存已清空';
};
// 同步（占位）
document.getElementById('acSyncBtn').onclick = function() {
  document.getElementById('acContent').textContent = '同步（占位）';
}; 