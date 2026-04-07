#!/usr/bin/env python3
import json
import os
import time
from config import STATS_FILE, FAILED_INTERVAL

# ---------- LOAD / SAVE STATS ----------
def load_stats():
    if not os.path.exists(STATS_FILE):
        return {}
    with open(STATS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_stats(stats):
    with open(STATS_FILE, "w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)

def init_kanji(stats, k):
    if k not in stats:
        stats[k] = {
            "shown": 0,
            "remembered": 0,
            "failed": 0,
            "interval": FAILED_INTERVAL,
            "due": time.time()
        }
