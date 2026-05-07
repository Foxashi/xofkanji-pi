import json
import os
import subprocess
from flask import Blueprint, jsonify
from py.config import DISPLAY_STATE_FILE
from py.backend.display import DISPLAY_SCRIPT, get_display_pid, kill_display

bp = Blueprint('display', __name__)


@bp.route('/api/display', methods=['GET'])
def api_display_state():
    pid = get_display_pid()
    if not pid or not os.path.exists(DISPLAY_STATE_FILE):
        return jsonify({"running": False})

    with open(DISPLAY_STATE_FILE, "r") as f:
        state = json.load(f)

    state["running"] = True
    return jsonify(state)


@bp.route('/api/display/restart', methods=['POST'])
def api_display_restart():
    pid = get_display_pid()
    if pid:
        kill_display(pid)

    if os.path.exists(DISPLAY_STATE_FILE):
        os.remove(DISPLAY_STATE_FILE)

    project_root = os.path.normpath(
        os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..')
    )
    script_path = os.path.join(project_root, DISPLAY_SCRIPT)
    subprocess.Popen(["python3", script_path], cwd=project_root)
    return jsonify({"success": True, "message": "Display app restarting."})


@bp.route('/api/display/stop', methods=['POST'])
def api_display_stop():
    pid = get_display_pid()
    if not pid:
        return jsonify({"success": False, "message": "Display app is not running."})

    kill_display(pid)

    if os.path.exists(DISPLAY_STATE_FILE):
        os.remove(DISPLAY_STATE_FILE)

    return jsonify({"success": True, "message": "Display app stopped."})
