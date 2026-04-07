#!/usr/bin/env python3
import json
import random
import time
from config import KANJI_FILE
from stats import init_kanji

# ---------- LOAD KANJI ----------
def load_kanji():
    try:
        with open(KANJI_FILE, "r", encoding="utf-8") as f:
            return json.load(f)["kanji"]
    except:
        return []

# ---------- PICK KANJI ----------
def pick_due_kanji(kanji_list, stats):
    now = time.time()
    due = []

    for k in kanji_list:
        init_kanji(stats, k["kanji"])
        if stats[k["kanji"]]["due"] <= now:
            due.append(k)

    if due:
        return random.choice(due)

    return min(kanji_list, key=lambda k: stats[k["kanji"]]["due"])
