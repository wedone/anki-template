// 模式切换和面板加载
const modeToggle = document.getElementById('modeToggle');
const modeLabel = document.getElementById('modeLabel');
function updateModeLabel() {
  modeLabel.textContent = modeToggle.checked ? '本地模式' : 'AnkiConnect模式';
}
modeToggle.addEventListener('change', function() {
  updateModeLabel();
  loadPanel(modeToggle.checked ? 'local' : 'ac');
});

window.onload = async function() {
  await loadPanel('local');
  updateModeLabel();
  setPreviewMode('mobile');
}

async function loadPanel(panel) {
  const res = await fetch(`/panel/${panel}`);
  const html = await res.text();
  document.getElementById('modePanel').innerHTML = html;
  // 动态加载对应 JS，先移除已存在的同名 script
  const oldScript = document.getElementById('panelScript');
  if (oldScript) oldScript.remove();
  const script = document.createElement('script');
  script.id = 'panelScript';
  script.src = `/static/panel_${panel}.js?ts=${Date.now()}`; // 加时间戳防缓存
  script.onload = function() {
    if (panel === 'local' && window.initPanelLocal) {
      window.initPanelLocal();
    }
    if (panel === 'ac' && window.initPanelAc) {
      window.initPanelAc();
    }
  };
  document.body.appendChild(script);
}

// 预览区相关逻辑
function setPreviewMode(mode) {
  const frame = document.getElementById('previewFrame');
  document.getElementById('previewToggle').checked = (mode === 'mobile');
  frame.classList.add('preview-frame');
  frame.classList.add('preview-frame-base');
  if (mode === 'mobile') {
    frame.classList.add('mobile');
  } else {
    frame.classList.remove('mobile');
  }
  resizePreviewFrame();
}
const previewToggle = document.getElementById('previewToggle');
function setPreviewModeByToggle() {
  if (previewToggle.checked) {
    setPreviewMode('mobile');
  } else {
    setPreviewMode('desktop');
  }
}
previewToggle.addEventListener('change', setPreviewModeByToggle);

function resizePreviewFrame() {
  const frame = document.getElementById('previewFrame');
  try {
    if (frame.contentDocument && frame.contentDocument.body) {
      frame.style.height = frame.contentDocument.body.scrollHeight + 'px';
    }
  } catch (e) {}
}
document.getElementById('previewFrame').addEventListener('load', resizePreviewFrame);