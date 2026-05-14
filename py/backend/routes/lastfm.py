import json
import os
from flask import Blueprint, jsonify, request
from py.config import LASTFM_CONFIG_FILE

bp = Blueprint('lastfm', __name__)


@bp.route('/api/lastfm', methods=['GET'])
def api_lastfm_get():
    cfg = {}
    if os.path.exists(LASTFM_CONFIG_FILE):
        with open(LASTFM_CONFIG_FILE, "r") as f:
            cfg = json.load(f)
    return jsonify({
        "api_key": cfg.get("api_key", ""),
        "has_api_secret": bool(cfg.get("api_secret", "")),
        "username": cfg.get("username", "")
    })


@bp.route('/api/lastfm', methods=['POST'])
def api_lastfm_save():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "No data provided"}), 400

    existing_cfg = {}
    if os.path.exists(LASTFM_CONFIG_FILE):
        with open(LASTFM_CONFIG_FILE, "r") as f:
            existing_cfg = json.load(f)

    new_secret = data.get("api_secret", "").strip()
    cfg = {
        "api_key": data.get("api_key", "").strip(),
        "api_secret": new_secret if new_secret else existing_cfg.get("api_secret", ""),
        "username": data.get("username", "").strip()
    }
    with open(LASTFM_CONFIG_FILE, "w") as f:
        json.dump(cfg, f, indent=2)

    return jsonify({"success": True, "message": "Last.fm settings saved. Restart the display app to apply."})
