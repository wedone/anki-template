from flask import Flask, render_template, request, send_from_directory, jsonify
import os
import pystache
import re
import json

app = Flask(__name__)

TEMPLATE_BASE = os.path.join(app.root_path, 'templates')

def get_template_dirs():
    return [
        d for d in os.listdir(TEMPLATE_BASE)
        if os.path.isdir(os.path.join(TEMPLATE_BASE, d)) and
           all(os.path.exists(os.path.join(TEMPLATE_BASE, d, f)) for f in ['front.html', 'back.html', 'style.css', 'fields_data.json'])
    ]

def scan_template_fields(tpl_name):
    field_pattern = re.compile(r'\{\{[#\{]?\s*([\w\-]+)\s*\}?\}\}')
    seen = set()
    ordered_fields = []
    for fname in ['front.html', 'back.html']:
        path = os.path.join(TEMPLATE_BASE, tpl_name, fname)
        if os.path.exists(path):
            with open(path, encoding='utf-8') as f:
                content = f.read()
            for m in field_pattern.finditer(content):
                field = m.group(1)
                if field not in seen:
                    ordered_fields.append(field)
                    seen.add(field)
    return ordered_fields

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

@app.route('/')
def index():
    return render_template('form.html')

@app.route('/template_list')
def template_list():
    return jsonify({'templates': get_template_dirs()})

@app.route('/scan_fields')
def scan_fields():
    tpl = request.args.get('tpl')
    if not tpl:
        return jsonify({'fields': []})
    fields = scan_template_fields(tpl)
    return jsonify({'fields': fields})

@app.route('/load_fields')
def load_fields():
    tpl = request.args.get('tpl')
    if not tpl:
        return jsonify({})
    fields_path = os.path.join(TEMPLATE_BASE, tpl, 'fields_data.json')
    if os.path.exists(fields_path):
        with open(fields_path, encoding='utf-8') as f:
            data = json.load(f)
        return jsonify(data)
    return jsonify({})

@app.route('/save_fields', methods=['POST'])
def save_fields():
    tpl = request.args.get('tpl')
    if not tpl:
        return jsonify({'status': 'fail', 'msg': 'no tpl'})
    fields_path = os.path.join(TEMPLATE_BASE, tpl, 'fields_data.json')
    data = request.json
    with open(fields_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return jsonify({'status': 'ok'})

@app.route('/preview/<side>', methods=['POST'])
def preview(side):
    tpl = request.args.get('tpl')
    if not tpl:
        return 'No template selected', 400
    data = request.form.to_dict()
    if side == 'back':
        with open(os.path.join(TEMPLATE_BASE, tpl, 'front.html'), encoding='utf-8') as f:
            front_tpl = f.read()
        front_html = render_with_safe_fields(front_tpl, data)
        with open(os.path.join(TEMPLATE_BASE, tpl, 'back.html'), encoding='utf-8') as f:
            tpl_content = f.read()
        placeholder = '__FRONT_SIDE_PLACEHOLDER__'
        tpl_content = tpl_content.replace('{{FrontSide}}', placeholder).replace('{{{FrontSide}}}', placeholder)
        body = render_with_safe_fields(tpl_content, {**data, 'FrontSide': ''})
        body = body.replace(placeholder, front_html)
    else:
        with open(os.path.join(TEMPLATE_BASE, tpl, 'front.html'), encoding='utf-8') as f:
            tpl_content = f.read()
        body = render_with_safe_fields(tpl_content, data)
    html = f'''<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n  <meta charset="UTF-8">\n  <link rel="stylesheet" href="/templates/{tpl}/style.css">\n</head>\n<body>\n{body}\n</body>\n</html>'''
    return html

@app.route('/templates/<tpl>/<filename>')
def templates_static_files(tpl, filename):
    return send_from_directory(os.path.join(TEMPLATE_BASE, tpl), filename)

if __name__ == '__main__':
    app.run(debug=True) 