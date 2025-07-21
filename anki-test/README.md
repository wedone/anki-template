# Anki 数学问答模板预览工具

本工具用于本地预览和测试 Anki 数学问答卡片模板，支持字段批量输入、正反面切换、桌面/手机模式切换，渲染效果与 Anki 保持一致。

---

## 目录结构

```
anki-test/
├── app.py              # Flask 主程序
├── static/             # 静态资源目录
│   ├── back.html       # Anki 卡片背面模板（Mustache语法）
│   ├── front.html      # Anki 卡片正面模板（Mustache语法）
│   ├── style.css       # 卡片样式
│   └── ...             # 字体等资源
├── templates/
│   └── form.html       # 字段输入与预览主页面
└── README.md           # 本说明文档
```

---

## 部署与运行

### 1. 安装依赖

确保已安装 Python 3.7+，推荐 3.8 及以上。

```bash
pip install flask pystache
```

### 2. 启动服务

在 `anki-test` 目录下运行：

```bash
python app.py
```

### 3. 访问页面

浏览器打开 [http://127.0.0.1:5000/](http://127.0.0.1:5000/)

---

## 使用说明

- 左侧填写各字段内容，点击字段名可展开输入。
- 顶部可切换正面/背面预览，支持桌面/手机模式切换。
- 支持 MathJax 数学公式渲染，样式与 Anki 内部一致。
- “刷新预览”可手动刷新右侧渲染效果。
- “清空”可一键清空所有字段。

---

## 常见问题

1. **预览渲染不正常/样式错乱？**
   - 请确保 `static/back.html`、`static/front.html`、`static/style.css` 都存在且内容完整。
   - 若有自定义模板，需保持 Mustache 语法（`{{#xxx}}...{{/xxx}}`）。

2. **字体文件缺失？**
   - 若有字体需求，请将字体文件放入 `static/` 目录。

3. **端口被占用？**
   - 修改 `app.py` 最后一行为 `app.run(port=xxxx)`，指定其它端口。

---

## 其它说明

- 本工具仅用于本地预览和调试 Anki 模板，不会影响你的 Anki 数据库。
- 如需扩展字段、分组、交互等，可直接修改 `form.html`。
- 如遇问题欢迎反馈。 