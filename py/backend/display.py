#!/usr/bin/env python3
import json
import os
import signal
import subprocess
import time
from py.config import DISPLAY_STATE_FILE

DISPLAY_SCRIPT = "main.py"


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
