#!/usr/bin/env python3
import json
import os
import tempfile
import time
from config import STATS_FILE, FAILED_INTERVAL

# ---------- LOAD / SAVE STATS ----------
def load_stats():
    if not os.path.exists(STATS_FILE) or os.path.getsize(STATS_FILE) == 0:
        return {}
    with open(STATS_FILE, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {}

def save_stats(stats):
    dir_name = os.path.dirname(STATS_FILE) or '.'
    with tempfile.NamedTemporaryFile('w', dir=dir_name, suffix='.tmp',
                                     delete=False, encoding='utf-8') as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)
        f.flush()
        os.fsync(f.fileno())
        tmp_path = f.name
    os.replace(tmp_path, STATS_FILE)

def init_kanji(stats, k):
    if k not in stats:
        stats[k] = {
            "shown": 0,
            "remembered": 0,
            "failed": 0,
            "interval": FAILED_INTERVAL,
            "due": time.time()
        }
