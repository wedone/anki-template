from flask import Flask, render_template, request, send_from_directory
import os
import pystache

app = Flask(__name__)

# 字段列表（可根据模板实际字段扩展）
FIELDS = [
    'Question', 'Answer', 'Diff', 'tag', 'Hint', 'Image', '来源', 'Example', 'Concept', 'Formula', 'Mistakes',
] + [f'Answer-{i}' for i in range(1, 21)]

@app.route('/', methods=['GET', 'POST'])
def index():
    data = {field: '' for field in FIELDS}
    side = request.args.get('side', 'front')
    if request.method == 'POST':
        for field in FIELDS:
            data[field] = request.form.get(field, '')
        side = request.form.get('side', 'front')
    return render_template('form.html', data=data, side=side)

@app.route('/preview/<side>', methods=['POST'])
def preview(side):
    data = {field: request.form.get(field, '') for field in FIELDS}
    if side == 'back':
        # 渲染正面，得到 HTML
        with open(os.path.join(app.template_folder, 'front.html'), encoding='utf-8') as f:
            front_tpl = f.read()
        front_html = pystache.render(front_tpl, data)
        # 用唯一占位符替换 back.html 里的 {{FrontSide}}
        tpl_file = 'back.html'
        with open(os.path.join(app.template_folder, tpl_file), encoding='utf-8') as f:
            tpl = f.read()
        # 用唯一占位符替换所有 {{FrontSide}} 和 {{{FrontSide}}}
        placeholder = '__FRONT_SIDE_PLACEHOLDER__'
        tpl = tpl.replace('{{FrontSide}}', placeholder).replace('{{{FrontSide}}}', placeholder)
        body = pystache.render(tpl, {**data, 'FrontSide': ''})
        # 渲染后再替换占位符为 front_html
        body = body.replace(placeholder, front_html)
    else:
        tpl_file = 'front.html'
        with open(os.path.join(app.template_folder, tpl_file), encoding='utf-8') as f:
            tpl = f.read()
        body = pystache.render(tpl, data)
    # 包裹完整 HTML
    html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="/static/style.css">
</head>
<body>
{body}
</body>
</html>'''
    return html

# 静态文件（字体等）
@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory(os.path.join(app.root_path, 'static'), filename)

if __name__ == '__main__':
    app.run(debug=True) 