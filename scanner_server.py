#!/usr/bin/env python3
import os
import json
import re
import signal
import subprocess
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
    with open(KANJI_FILE, "w", encoding="utf-8") as f:
        json.dump(db, f, ensure_ascii=False, indent=2)

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