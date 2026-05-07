import json
import os
import re
import tempfile
from flask import Blueprint, jsonify, request
from werkzeug.utils import secure_filename
from py.config import THEMES_FILE, THEME_STATE_FILE

bp = Blueprint('themes', __name__)


def _normalize_color(v):
    if isinstance(v, str) and v.startswith('#') and len(v) == 7:
        try:
            r = int(v[1:3], 16)
            g = int(v[3:5], 16)
            b = int(v[5:7], 16)
            return [r, g, b]
        except Exception:
            return None
    if isinstance(v, list) and len(v) == 3:
        return [int(v[0]), int(v[1]), int(v[2])]
    return None


@bp.route('/api/themes')
def api_themes():
    themes = {}
    if os.path.exists(THEMES_FILE) and os.path.getsize(THEMES_FILE) > 0:
        try:
            with open(THEMES_FILE, "r", encoding="utf-8") as f:
                themes = json.load(f)
        except json.JSONDecodeError:
            pass

    active = "default"
    if os.path.exists(THEME_STATE_FILE):
        try:
            with open(THEME_STATE_FILE, "r", encoding="utf-8") as f:
                active = json.load(f).get("theme", "default")
        except (json.JSONDecodeError, OSError):
            pass

    theme_list = []
    for name, props in themes.items():
        theme_list.append({
            "name": name,
            "colors": {k: props[k] for k in props if isinstance(props[k], list) and len(props[k]) == 3},
            "has_background_image": bool(props.get("background_image"))
        })

    return jsonify({"themes": theme_list, "active": active})


@bp.route('/api/theme', methods=['POST'])
def api_set_theme():
    data = request.get_json()
    if not data or "theme" not in data:
        return jsonify({"success": False, "message": "No theme specified"}), 400

    theme_name = data["theme"]

    themes = {}
    if os.path.exists(THEMES_FILE) and os.path.getsize(THEMES_FILE) > 0:
        try:
            with open(THEMES_FILE, "r", encoding="utf-8") as f:
                themes = json.load(f)
        except json.JSONDecodeError:
            pass

    if theme_name not in themes:
        return jsonify({"success": False, "message": "Theme not found"}), 404

    dir_name = os.path.dirname(THEME_STATE_FILE) or '.'
    with tempfile.NamedTemporaryFile('w', dir=dir_name, suffix='.tmp',
                                     delete=False, encoding='utf-8') as f:
        json.dump({"theme": theme_name}, f)
        f.flush()
        os.fsync(f.fileno())
        tmp_path = f.name
    os.replace(tmp_path, THEME_STATE_FILE)

    return jsonify({"success": True, "message": f"Theme set to '{theme_name}'"})


@bp.route('/api/themes', methods=['POST'])
def api_create_theme():
    name = None
    colors = {}
    bg_file = None

    if request.content_type and request.content_type.startswith('multipart/form-data'):
        name = request.form.get('name', '').strip()
        colors_raw = request.form.get('colors', '')
        bg_file = request.files.get('background_image')
        try:
            if colors_raw:
                colors = json.loads(colors_raw)
        except Exception:
            colors = {}
    else:
        data = request.get_json() or {}
        name = (data.get('name') or '').strip()
        colors = data.get('colors', {})

    if not name:
        return jsonify({"success": False, "message": "Theme name is required"}), 400

    safe_name = re.sub(r'[^a-zA-Z0-9 _\-]', '', name)

    themes = {}
    if os.path.exists(THEMES_FILE) and os.path.getsize(THEMES_FILE) > 0:
        try:
            with open(THEMES_FILE, 'r', encoding='utf-8') as f:
                themes = json.load(f)
        except json.JSONDecodeError:
            themes = {}

    if name in themes:
        return jsonify({"success": False, "message": "A theme with that name already exists"}), 409

    theme_obj = {}
    for k, v in (colors or {}).items():
        nc = _normalize_color(v)
        if nc:
            theme_obj[k] = nc

    if bg_file and bg_file.filename:
        # resolve themes_images/ relative to project root (3 levels up from this file)
        project_root = os.path.normpath(
            os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..')
        )
        images_dir = os.path.join(project_root, 'themes_images')
        os.makedirs(images_dir, exist_ok=True)
        filename = secure_filename(bg_file.filename)
        save_name = f"{safe_name.replace(' ', '_')}_{filename}"
        save_path = os.path.join(images_dir, save_name)
        try:
            bg_file.save(save_path)
            theme_obj['background_image'] = os.path.join('themes_images', save_name)
        except Exception as e:
            return jsonify({"success": False, "message": f"Failed to save image: {e}"}), 500

    themes[name] = theme_obj
    dir_name = os.path.dirname(THEMES_FILE) or '.'
    try:
        with tempfile.NamedTemporaryFile('w', dir=dir_name, suffix='.tmp',
                                         delete=False, encoding='utf-8') as f:
            json.dump(themes, f, ensure_ascii=False, indent=2)
            f.flush()
            os.fsync(f.fileno())
            tmp_path = f.name
        os.replace(tmp_path, THEMES_FILE)
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to save theme: {e}"}), 500

    return jsonify({"success": True, "message": "Theme created"})
