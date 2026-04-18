#!/usr/bin/env python3
import os
import json
import re
import signal
import subprocess
import tempfile
import requests
import time
from flask import Flask, request, jsonify, render_template
from PIL import Image, ImageEnhance
import pytesseract

app = Flask(__name__)
KANJI_FILE = "kanji.json"
STATS_FILE = "stats.json"
LASTFM_CONFIG_FILE = "lastfm_config.json"
DISPLAY_STATE_FILE = "display_state.json"
THEMES_FILE = "themes.json"
THEME_STATE_FILE = "theme_state.json"
DISPLAY_SCRIPT = "main.py"

if os.path.exists(DISPLAY_STATE_FILE):
    os.remove(DISPLAY_STATE_FILE)

def load_kanji_db():
    if os.path.exists(KANJI_FILE) and os.path.getsize(KANJI_FILE) > 0:
        try:
            with open(KANJI_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if "kanji" not in data:
                    data["kanji"] = []
                return data
        except json.JSONDecodeError:
            return {"kanji": []}
    return {"kanji": []}

def save_kanji_db(db):
    dir_name = os.path.dirname(KANJI_FILE) or '.'
    with tempfile.NamedTemporaryFile('w', dir=dir_name, suffix='.tmp',
                                     delete=False, encoding='utf-8') as f:
        json.dump(db, f, ensure_ascii=False, indent=2)
        f.flush()
        os.fsync(f.fileno())
        tmp_path = f.name
    os.replace(tmp_path, KANJI_FILE)

def extract_kanji_from_image(image, direction="horizontal"):
    img = image.convert('L')
    img = ImageEnhance.Contrast(img).enhance(2.5)
    img = ImageEnhance.Sharpness(img).enhance(2.0)
    img = img.point(lambda p: p > 140 and 255)

    if direction == 'vertical':
        custom_config = '--psm 5'
        lang_pack = 'jpn_vert'
    else:
        custom_config = '--psm 3'
        lang_pack = 'jpn'

    raw_text = pytesseract.image_to_string(img, lang=lang_pack, config=custom_config)
    kanji_chars = re.findall(r'[\u4E00-\u9FFF]', raw_text)
    return list(set(kanji_chars))

def fetch_kanji_info(kanji_char):
    try:
        url = f"https://kanjiapi.dev/v1/kanji/{kanji_char}"
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            jlpt = data.get("jlpt")
            level_str = f"N{jlpt}" if jlpt else "Unknown"

            top_onyomi = data.get("on_readings", [])[:2]
            top_kunyomi = data.get("kun_readings", [])[:2]
            top_meanings = data.get("meanings", [])[:3]

            return {
                "kanji": kanji_char,
                "onyomi": "・".join(top_onyomi),
                "kunyomi": "・".join(top_kunyomi),
                "meaning": ", ".join(top_meanings),
                "level": level_str
            }
    except Exception as e:
        print(f"Error fetching {kanji_char}: {e}")
    return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dash.html')

@app.route('/api/stats')
def api_stats():
    db = load_kanji_db()
    total_kanji = len(db.get("kanji", []))

    levels = {}
    for k in db.get("kanji", []):
        lvl = k.get("level", "Unknown")
        levels[lvl] = levels.get(lvl, 0) + 1

    stats = {}
    if os.path.exists(STATS_FILE) and os.path.getsize(STATS_FILE) > 0:
        with open(STATS_FILE, "r", encoding="utf-8") as f:
            stats = json.load(f)

    total_shown = sum(s.get("shown", 0) for s in stats.values())
    total_remembered = sum(s.get("remembered", 0) for s in stats.values())
    total_failed = sum(s.get("failed", 0) for s in stats.values())
    total_reviews = total_remembered + total_failed
    accuracy = round(total_remembered / total_reviews * 100, 1) if total_reviews > 0 else 0

    now = time.time()
    due_count = sum(1 for s in stats.values() if s.get("due", 0) <= now)

    return jsonify({
        "total_kanji": total_kanji,
        "total_shown": total_shown,
        "total_remembered": total_remembered,
        "total_failed": total_failed,
        "accuracy": accuracy,
        "due_now": due_count,
        "levels": levels
    })

@app.route('/api/lastfm', methods=['GET'])
def api_lastfm_get():
    cfg = {}
    if os.path.exists(LASTFM_CONFIG_FILE):
        with open(LASTFM_CONFIG_FILE, "r") as f:
            cfg = json.load(f)
    return jsonify({
        "api_key": cfg.get("api_key", ""),
        "api_secret": cfg.get("api_secret", ""),
        "username": cfg.get("username", "")
    })

@app.route('/api/lastfm', methods=['POST'])
def api_lastfm_save():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "No data provided"}), 400

    cfg = {
        "api_key": data.get("api_key", "").strip(),
        "api_secret": data.get("api_secret", "").strip(),
        "username": data.get("username", "").strip()
    }
    with open(LASTFM_CONFIG_FILE, "w") as f:
        json.dump(cfg, f, indent=2)

    return jsonify({"success": True, "message": "Last.fm settings saved. Restart the display app to apply."})

@app.route('/api/themes')
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

@app.route('/api/theme', methods=['POST'])
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

def is_display_process(pid):
    try:
        result = subprocess.run(
            ["ps", "-p", str(pid), "-o", "args="],
            capture_output=True, text=True, timeout=2
        )
        cmdline = result.stdout.strip()
        return DISPLAY_SCRIPT in cmdline
    except Exception:
        return False

def get_display_pid():
    if os.path.exists(DISPLAY_STATE_FILE):
        try:
            with open(DISPLAY_STATE_FILE, "r") as f:
                state = json.load(f)
            pid = state.get("pid")
            if pid:
                try:
                    os.kill(pid, 0)
                except OSError:
                    return None
                if is_display_process(pid):
                    return pid
        except (json.JSONDecodeError, OSError):
            pass
    return None

def kill_display(pid):
    try:
        os.kill(pid, signal.SIGTERM)
    except ProcessLookupError:
        return

    for _ in range(20):
        time.sleep(0.25)
        try:
            os.kill(pid, 0)
        except OSError:
            return

    try:
        os.kill(pid, signal.SIGKILL)
    except ProcessLookupError:
        pass
    time.sleep(0.5)

@app.route('/api/kanji-by-level/<level>')
def api_kanji_by_level(level):
    db = load_kanji_db()
    stats = {}
    if os.path.exists(STATS_FILE) and os.path.getsize(STATS_FILE) > 0:
        with open(STATS_FILE, "r", encoding="utf-8") as f:
            stats = json.load(f)

    result = []
    for k in db.get("kanji", []):
        if k.get("level", "Unknown") == level:
            s = stats.get(k["kanji"], {})
            result.append({
                "kanji": k["kanji"],
                "onyomi": k.get("onyomi", ""),
                "kunyomi": k.get("kunyomi", ""),
                "meaning": k.get("meaning", ""),
                "shown": s.get("shown", 0),
                "remembered": s.get("remembered", 0),
                "failed": s.get("failed", 0)
            })
    return jsonify({"level": level, "kanji": result})

@app.route('/api/random-kanji')
def api_random_kanji():
    import random
    db = load_kanji_db()
    kanji_list = db.get("kanji", [])
    if not kanji_list:
        return jsonify({"error": "No kanji available"}), 404
    entry = random.choice(kanji_list)
    return jsonify(entry)

@app.route('/api/recent-kanji')
def api_recent_kanji():
    db = load_kanji_db()
    kanji_list = db.get("kanji", [])
    recent = kanji_list[-10:][::-1]
    return jsonify({"recent": recent})

@app.route('/api/display', methods=['GET'])
def api_display_state():
    pid = get_display_pid()
    if not pid or not os.path.exists(DISPLAY_STATE_FILE):
        return jsonify({"running": False})

    with open(DISPLAY_STATE_FILE, "r") as f:
        state = json.load(f)

    state["running"] = True
    return jsonify(state)

@app.route('/api/display/restart', methods=['POST'])
def api_display_restart():
    pid = get_display_pid()
    if pid:
        kill_display(pid)

    if os.path.exists(DISPLAY_STATE_FILE):
        os.remove(DISPLAY_STATE_FILE)

    script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), DISPLAY_SCRIPT)
    subprocess.Popen(["python3", script_path], cwd=os.path.dirname(os.path.abspath(__file__)))
    return jsonify({"success": True, "message": "Display app restarting."})

@app.route('/api/display/stop', methods=['POST'])
def api_display_stop():
    pid = get_display_pid()
    if not pid:
        return jsonify({"success": False, "message": "Display app is not running."})

    kill_display(pid)

    if os.path.exists(DISPLAY_STATE_FILE):
        os.remove(DISPLAY_STATE_FILE)

    return jsonify({"success": True, "message": "Display app stopped."})


@app.route('/upload', methods=['POST'])
def upload_image():
    start_time = time.time()

    if 'image' not in request.files:
        return jsonify({"success": False, "message": "No image uploaded"}), 400

    file = request.files['image']
    direction = request.form.get('direction', 'horizontal')
    
    if file.filename == '':
        return jsonify({"success": False, "message": "No file selected"}), 400

    try:
        img = Image.open(file)
        
        found_kanji = extract_kanji_from_image(img, direction)

        if not found_kanji:
            elapsed = time.time() - start_time
            return jsonify({
                "success": False, 
                "message": "No Kanji found in the image",
                "time": round(elapsed, 2)
            }), 200

        db = load_kanji_db()
        existing_kanji = {k["kanji"] for k in db["kanji"]}

        added_kanji = []
        for char in found_kanji:
            if char not in existing_kanji:
                info = fetch_kanji_info(char)
                if info:
                    db["kanji"].append(info)
                    added_kanji.append(char)
                    existing_kanji.add(char)

        elapsed = time.time() - start_time

        if added_kanji:
            save_kanji_db(db)
            return jsonify({
                "success": True,
                "message": f"Successfully added {len(added_kanji)} new kanji!",
                "kanji": added_kanji,
                "total_found": len(found_kanji),
                "time": round(elapsed, 2)
            }), 200
        else:
            return jsonify({
                "success": False,
                "message": f"Found {len(found_kanji)} kanji, but they are already in your list",
                "kanji": found_kanji,
                "time": round(elapsed, 2)
            }), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Error processing image: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)