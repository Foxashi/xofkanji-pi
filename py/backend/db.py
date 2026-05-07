#!/usr/bin/env python3
import json
import os
import tempfile
from py.config import KANJI_FILE


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
