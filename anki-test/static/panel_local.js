let currentTemplate = '';
let currentSide = 'front';
let allFieldData = {};

async function loadTemplateList() {
  const res = await fetch('/template_list');
  const data = await res.json();
  const select = document.getElementById('templateSelect');
  select.innerHTML = '';
  data.templates.forEach(tpl => {
    const opt = document.createElement('option');
    opt.value = tpl;
    opt.textContent = tpl;
    select.appendChild(opt);
  });
  if (data.templates.length > 0) {
    currentTemplate = data.templates[0];
    select.value = currentTemplate;
  }
}

document.getElementById('templateSelect').addEventListener('change', async function() {
  currentTemplate = this.value;
  await renderFields();
  await syncCardStyleToPreviewFrame(currentTemplate);
  setPreviewSide(currentSide);
});

async function renderFields() {
  if (!currentTemplate) return;
  const [fieldsRes, dataRes] = await Promise.all([
    fetch(`/scan_fields?tpl=${currentTemplate}`).then(r => r.json()),
    fetch(`/load_fields?tpl=${currentTemplate}`).then(r => r.json())
  ]);
  const fields = fieldsRes.fields;
  allFieldData = { ...dataRes };
  const fieldGrid = document.getElementById('fieldGrid');
  fieldGrid.innerHTML = '';
  fields.forEach(field => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'field-btn';
    btn.textContent = field;
    btn.dataset.field = field;
    if (allFieldData[field]) btn.classList.add('filled');
    btn.onclick = function(e) { showFieldInput(field, btn); };
    fieldGrid.appendChild(btn);
  });
}

function syncFieldsToForm() {
  const hidden = document.getElementById('hiddenFields');
  hidden.innerHTML = '';
  Object.keys(allFieldData).forEach(field => {
    const ta = document.createElement('textarea');
    ta.name = field;
    ta.style.display = 'none';
    ta.value = allFieldData[field];
    hidden.appendChild(ta);
  });
}

function setPreviewSide(side) {
  currentSide = side;
  document.getElementById('sideInput').value = side;
  document.getElementById('frontBtn').classList.toggle('active', side === 'front');
  document.getElementById('backBtn').classList.toggle('active', side === 'back');
  document.getElementById('ankiForm').action = `/preview/${side}?tpl=${currentTemplate}`;
  syncFieldsToForm();
  document.getElementById('ankiForm').submit();
}

document.getElementById('frontBtn').onclick = function() { setPreviewSide('front'); };
document.getElementById('backBtn').onclick = function() { setPreviewSide('back'); };
document.getElementById('refreshBtn').onclick = function(e) {
  e.preventDefault();
  syncFieldsToForm();
  document.getElementById('ankiForm').submit();
};

document.getElementById('saveServerBtn').onclick = async function() {
  await fetch(`/save_fields?tpl=${currentTemplate}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(allFieldData)
  });
  alert('已保存到服务器！');
};
document.getElementById('scanFieldsBtn').onclick = async function() {
  await renderFields();
};

function showFieldInput(field, btn) {
  const floatBox = document.getElementById('fieldInputFloat');
  if (floatBox.style.display === 'block' && floatBox.dataset.field === field) {
    floatBox.style.display = 'none';
    btn.classList.remove('active');
    return;
  }
  document.querySelectorAll('.field-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  floatBox.innerHTML = `
    <button class="close-btn" onclick="hideFieldInput()">×</button>
    <label>${field}</label>
    <textarea id="floatInput" style="resize:vertical;">${allFieldData[field] || ''}</textarea>
  `;
  floatBox.style.display = 'block';
  floatBox.dataset.field = field;
  const rect = btn.getBoundingClientRect();
  const floatWidth = 520;
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
  floatBox.style.top = (rect.bottom + scrollTop + 12) + 'px';
  floatBox.style.left = (rect.left + rect.width / 2 - floatWidth / 2 + scrollLeft) + 'px';
  const input = document.getElementById('floatInput');
  input.focus();
  input.oninput = function() {
    allFieldData[field] = input.value;
    btn.classList.toggle('filled', !!input.value.trim());
  };
}
function hideFieldInput() {
  const floatBox = document.getElementById('fieldInputFloat');
  floatBox.style.display = 'none';
  document.querySelectorAll('.field-btn').forEach(b => b.classList.remove('active'));
}
document.addEventListener('mousedown', function(e) {
  const floatBox = document.getElementById('fieldInputFloat');
  if (floatBox.style.display === 'block') {
    if (!floatBox.contains(e.target) && !e.target.classList.contains('field-btn')) {
      hideFieldInput();
    }
  }
});

function clearForm() {
  var t = document.querySelectorAll('.form-panel textarea');
  t.forEach(e => e.value = '');
  allFieldData = {};
  setTimeout(() => setPreviewSide(currentSide), 10);
}

// 同步.card样式到.preview-frame-base
async function syncCardStyleToPreviewFrame(tplName) {
  try {
    const res = await fetch(`/templates/${tplName}/style.css`);
    if (!res.ok) return;
    const cssText = await res.text();
    // 提取 .card { ... } 样式
    const match = cssText.match(/\.card\s*\{([\s\S]*?)\}/);
    let styleTag = document.getElementById('previewFrameBaseStyle');
    if (!match) {
      // 没有.card类，清空样式
      if (styleTag) styleTag.innerHTML = '';
      return;
    }
    // 解析样式为对象
    const styleObj = {};
    match[1].split(';').forEach(line => {
      const [k, v] = line.split(':');
      if (k && v) styleObj[k.trim()] = v.trim();
    });
    // 拼接成css字符串
    let cssStr = '';
    for (const k in styleObj) {
      cssStr += `${k}: ${styleObj[k]};`;
    }
    // 动态写入到 .preview-frame-base
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'previewFrameBaseStyle';
      document.head.appendChild(styleTag);
    }
    styleTag.innerHTML = `.preview-frame-base { ${cssStr} }`;
  } catch (e) {
    // 忽略错误
  }
}

window.initPanelLocal = async function() {
  await loadTemplateList();
  await renderFields();
  await syncCardStyleToPreviewFrame(currentTemplate);
  setPreviewSide('front');
};
window.initPanelLocal(); 