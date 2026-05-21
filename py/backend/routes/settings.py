import json, os, tempfile
from flask import Blueprint, jsonify, request
from py.config import SETTINGS_FILE, STATS_FILE, KANJI_FILE

bp = Blueprint('settings', __name__)

SETTINGS_DEFAULTS = {
    "kanji_change_time": 900,
    "lastfm_update_time": 10,
    "failed_interval": 900,
    "max_interval": 604800,
    "kanji_reload_interval": 30,
    "theme_reload_interval": 5,
    "srs_ease_factor": 2.0,
    "screen_width": 480,
    "screen_height": 320,
}

FLOAT_KEYS = {"srs_ease_factor"}


def load_settings():
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r") as f:
                data = json.load(f)
            return {**SETTINGS_DEFAULTS, **data}
        except (json.JSONDecodeError, OSError):
            pass
    return dict(SETTINGS_DEFAULTS)


@bp.route('/api/settings', methods=['GET'])
def api_settings_get():
    return jsonify(load_settings())


@bp.route('/api/settings', methods=['POST'])
def api_settings_save():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "No data provided"}), 400

    current = load_settings()

    for key in SETTINGS_DEFAULTS:
        if key in data:
            try:
                if key in FLOAT_KEYS:
                    val = float(data[key])
                    if val <= 0:
                        return jsonify({"success": False, "message": f"'{key}' must be greater than 0"}), 400
                else:
                    val = int(data[key])
                    if val < 1:
                        return jsonify({"success": False, "message": f"'{key}' must be at least 1"}), 400
                current[key] = val
            except (TypeError, ValueError):
                return jsonify({"success": False, "message": f"'{key}' must be a number"}), 400

    os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)
    with open(SETTINGS_FILE, "w") as f:
        json.dump(current, f, indent=2)

    return jsonify({"success": True, "message": "Settings saved. Restart the display app to apply."})


@bp.route('/api/reset/stats', methods=['POST'])
def api_reset_stats():
    empty = {}
    dir_name = os.path.dirname(STATS_FILE) or '.'
    os.makedirs(dir_name, exist_ok=True)
    with tempfile.NamedTemporaryFile('w', dir=dir_name, suffix='.tmp',
                                     delete=False, encoding='utf-8') as f:
        json.dump(empty, f, indent=2)
        f.flush()
        os.fsync(f.fileno())
        tmp_path = f.name
    os.replace(tmp_path, STATS_FILE)
    return jsonify({"success": True, "message": "Stats database has been reset."})


@bp.route('/api/reset/kanji', methods=['POST'])
def api_reset_kanji():
    empty = {"kanji": []}
    dir_name = os.path.dirname(KANJI_FILE) or '.'
    os.makedirs(dir_name, exist_ok=True)
    with tempfile.NamedTemporaryFile('w', dir=dir_name, suffix='.tmp',
                                     delete=False, encoding='utf-8') as f:
        json.dump(empty, f, ensure_ascii=False, indent=2)
        f.flush()
        os.fsync(f.fileno())
        tmp_path = f.name
    os.replace(tmp_path, KANJI_FILE)
    # also wipe stats since kanji entries are gone
    stats_empty = {}
    with tempfile.NamedTemporaryFile('w', dir=os.path.dirname(STATS_FILE) or '.', suffix='.tmp',
                                     delete=False, encoding='utf-8') as f:
        json.dump(stats_empty, f, indent=2)
        f.flush()
        os.fsync(f.fileno())
        tmp_path = f.name
    os.replace(tmp_path, STATS_FILE)
    return jsonify({"success": True, "message": "Kanji database (and stats) have been reset."})
