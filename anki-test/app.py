from flask import Flask, render_template, request, send_from_directory
import os
import pystache

app = Flask(__name__)

# 字段列表（可根据模板实际字段扩展）
FIELDS = [
    'Question', 'Answer', 'Diff', 'tag', 'Hint', 'Image', '来源', 'Example', 'Concept', 'Formula', 'Mistakes',
] + [f'Answer-{i}' for i in range(1, 21)]

def render_with_safe_fields(tpl, data):
    placeholders = {}
    safe_data = {}
    for k, v in data.items():
        if v:
            ph = f'__SAFE_FIELD_{k}__'
            placeholders[ph] = v
            safe_data[k] = ph
        else:
            safe_data[k] = ''
    rendered = pystache.render(tpl, safe_data)
    for ph, v in placeholders.items():
        rendered = rendered.replace(ph, v)
    return rendered

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
        with open(os.path.join(app.template_folder, 'front.html'), encoding='utf-8') as f:
            front_tpl = f.read()
        front_html = render_with_safe_fields(front_tpl, data)
        tpl_file = 'back.html'
        with open(os.path.join(app.template_folder, tpl_file), encoding='utf-8') as f:
            tpl = f.read()
        placeholder = '__FRONT_SIDE_PLACEHOLDER__'
        tpl = tpl.replace('{{FrontSide}}', placeholder).replace('{{{FrontSide}}}', placeholder)
        body = render_with_safe_fields(tpl, {**data, 'FrontSide': ''})
        body = body.replace(placeholder, front_html)
    else:
        tpl_file = 'front.html'
        with open(os.path.join(app.template_folder, tpl_file), encoding='utf-8') as f:
            tpl = f.read()
        body = render_with_safe_fields(tpl, data)
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