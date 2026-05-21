import json
import os
import random
import time
import re
import requests
from flask import Blueprint, jsonify, request
from PIL import Image
from py.config import STATS_FILE
from py.backend.db import load_kanji_db, save_kanji_db
from py.backend.ocr import extract_kanji_from_image, fetch_kanji_info

bp = Blueprint('kanji', __name__)

KANJI_RANGE_RE = re.compile(r'[\u4E00-\u9FFF]')
VOCAB_CACHE = {
    "key": None,
    "data": None,
    "timestamp": 0.0
}
VOCAB_CACHE_TTL = 60


def _extract_kanji_chars(text):
    return KANJI_RANGE_RE.findall(text or "")


def _is_vocab_supported(word, known_kanji):
    chars = _extract_kanji_chars(word)
    if not chars:
        return False
    return all(c in known_kanji for c in chars)


def _kanjivg_stroke_url(kanji_char):
    code = format(ord(kanji_char), 'x').zfill(5)
    return f"https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/{code}.svg"


def _fetch_words_for_kanji(kanji_char):
    try:
        url = f"https://kanjiapi.dev/v1/words/{kanji_char}"
        resp = requests.get(url, timeout=8)
        if resp.status_code == 200:
            data = resp.json()
            return data if isinstance(data, list) else []
    except Exception as e:
        print(f"Error fetching words for {kanji_char}: {e}")
    return []


def _normalize_vocab_entry(raw_entry):
    variants = raw_entry.get("variants") or []
    if not variants:
        return None

    best_variant = variants[0]
    written = best_variant.get("written") or ""
    pronounced = best_variant.get("pronounced") or ""
    meanings = raw_entry.get("meanings") or []

    if not written:
        return None

    meaning_texts = []
    for m in meanings:
        if isinstance(m, str):
            meaning_texts.append(m)
            continue

        if isinstance(m, dict):
            glosses = m.get("glosses")
            if isinstance(glosses, list):
                for g in glosses:
                    if isinstance(g, str) and g:
                        meaning_texts.append(g)
            text = m.get("text")
            if isinstance(text, str) and text:
                meaning_texts.append(text)
            continue

        if isinstance(m, list):
            for item in m:
                if isinstance(item, str) and item:
                    meaning_texts.append(item)

    return {
        "word": written,
        "reading": pronounced,
        "meaning": ", ".join(meaning_texts[:3])
    }


@bp.route('/api/stats')
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
    stats_due = sum(1 for s in stats.values() if s.get("due", 0) <= now)
    seen_chars = set(stats.keys())
    unseen_due = sum(1 for k in db.get("kanji", []) if k["kanji"] not in seen_chars)
    due_count = stats_due + unseen_due

    return jsonify({
        "total_kanji": total_kanji,
        "total_shown": total_shown,
        "total_remembered": total_remembered,
        "total_failed": total_failed,
        "accuracy": accuracy,
        "due_now": due_count,
        "levels": levels
    })


@bp.route('/api/kanji-by-level/<level>')
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


@bp.route('/api/random-kanji')
def api_random_kanji():
    db = load_kanji_db()
    kanji_list = db.get("kanji", [])

    stats = {}
    if os.path.exists(STATS_FILE) and os.path.getsize(STATS_FILE) > 0:
        try:
            with open(STATS_FILE, "r", encoding="utf-8") as f:
                stats = json.load(f)
        except json.JSONDecodeError:
            pass

    levels = request.args.get("levels", "")
    if levels:
        level_set = set(levels.split(","))
        kanji_list = [k for k in kanji_list if k.get("level", "Unknown") in level_set]

    seen = [k for k in kanji_list if k["kanji"] in stats]
    pool = seen if seen else kanji_list

    if not pool:
        return jsonify({"error": "No kanji available"}), 404
    entry = random.choice(pool)
    return jsonify(entry)


@bp.route('/api/recent-kanji')
def api_recent_kanji():
    db = load_kanji_db()
    kanji_list = db.get("kanji", [])
    recent = kanji_list[-10:][::-1]
    return jsonify({"recent": recent})


@bp.route('/api/vocabulary')
def api_vocabulary():
    limit = request.args.get("limit", default=200, type=int)
    per_kanji = request.args.get("per_kanji", default=6, type=int)
    kanji_filter = request.args.get("kanji", default="", type=str).strip()
    limit = max(5, min(limit, 500))
    per_kanji = max(1, min(per_kanji, 20))

    db = load_kanji_db()
    kanji_entries = db.get("kanji", [])
    known_kanji = {entry.get("kanji") for entry in kanji_entries if entry.get("kanji")}
    level_map = {
        entry.get("kanji"): entry.get("level", "Unknown")
        for entry in kanji_entries
        if entry.get("kanji")
    }

    if not known_kanji:
        return jsonify({
            "vocabulary": [],
            "source_kanji_count": 0,
            "generated_at": int(time.time())
        })

    # If the caller passed a specific kanji, only fetch words for that character.
    # We still require all kanji in a word to be known so results stay relevant.
    if kanji_filter and KANJI_RANGE_RE.match(kanji_filter[0]):
        target_kanji = {kanji_filter[0]}
    else:
        target_kanji = known_kanji

    cache_key = (tuple(sorted(target_kanji)), limit, per_kanji)
    now = time.time()
    if (
        VOCAB_CACHE["data"] is not None
        and VOCAB_CACHE["key"] == cache_key
        and now - VOCAB_CACHE["timestamp"] < VOCAB_CACHE_TTL
    ):
        return jsonify(VOCAB_CACHE["data"])

    dedup = {}
    ordered = []

    for kanji_char in sorted(target_kanji):
        words = _fetch_words_for_kanji(kanji_char)
        added_for_kanji = 0

        for raw in words:
            normalized = _normalize_vocab_entry(raw)
            if not normalized:
                continue

            word = normalized["word"]
            if not _is_vocab_supported(word, known_kanji):
                continue

            key = normalized["word"] + "|" + normalized["reading"]
            word_kanji = _extract_kanji_chars(word)
            unique_word_kanji = []
            for c in word_kanji:
                if c not in unique_word_kanji:
                    unique_word_kanji.append(c)

            if key in dedup:
                existing = dedup[key]
                existing_levels = set(existing["levels"])
                for c in unique_word_kanji:
                    lvl = level_map.get(c, "Unknown")
                    if lvl not in existing_levels:
                        existing["levels"].append(lvl)
                        existing_levels.add(lvl)
                continue

            vocab_entry = {
                "word": normalized["word"],
                "reading": normalized["reading"],
                "meaning": normalized["meaning"],
                "kanji": unique_word_kanji,
                "levels": [level_map.get(c, "Unknown") for c in unique_word_kanji],
                "stroke_order": [
                    {
                        "kanji": c,
                        "svg_url": _kanjivg_stroke_url(c)
                    }
                    for c in unique_word_kanji
                ]
            }

            dedup[key] = vocab_entry
            ordered.append(vocab_entry)
            added_for_kanji += 1

            if added_for_kanji >= per_kanji:
                break

        if len(ordered) >= limit:
            break

    payload = {
        "vocabulary": ordered[:limit],
        "source_kanji_count": len(target_kanji),
        "generated_at": int(time.time())
    }

    VOCAB_CACHE["key"] = cache_key
    VOCAB_CACHE["data"] = payload
    VOCAB_CACHE["timestamp"] = now
    return jsonify(payload)


@bp.route('/api/kanji/<char>')
def api_kanji_detail(char):
    if len(char) != 1 or not KANJI_RANGE_RE.match(char):
        return jsonify({"error": "Invalid kanji character"}), 400

    db = load_kanji_db()
    entry = next((k for k in db.get("kanji", []) if k.get("kanji") == char), None)

    if not entry:
        return jsonify({"error": "Kanji not found"}), 404

    stats = {}
    if os.path.exists(STATS_FILE) and os.path.getsize(STATS_FILE) > 0:
        with open(STATS_FILE, "r", encoding="utf-8") as f:
            stats = json.load(f)

    s = stats.get(char, {})
    return jsonify({
        "kanji": char,
        "meaning": entry.get("meaning", ""),
        "onyomi": entry.get("onyomi", ""),
        "kunyomi": entry.get("kunyomi", ""),
        "level": entry.get("level", "Unknown"),
        "shown": s.get("shown", 0),
        "remembered": s.get("remembered", 0),
        "failed": s.get("failed", 0),
        "due": s.get("due", None),
    })


@bp.route('/api/due-kanji')
def api_due_kanji():
    limit = request.args.get("limit", default=100, type=int)
    limit = max(1, min(limit, 500))

    db = load_kanji_db()
    kanji_list = db.get("kanji", [])

    stats = {}
    if os.path.exists(STATS_FILE) and os.path.getsize(STATS_FILE) > 0:
        with open(STATS_FILE, "r", encoding="utf-8") as f:
            try:
                stats = json.load(f)
            except json.JSONDecodeError:
                pass

    now = time.time()
    due = []
    for k in kanji_list:
        char = k["kanji"]
        s = stats.get(char)
        if s is None or s.get("due", 0) <= now:
            due.append({
                "kanji": char,
                "meaning": k.get("meaning", ""),
                "onyomi": k.get("onyomi", ""),
                "kunyomi": k.get("kunyomi", ""),
                "level": k.get("level", "Unknown"),
                "shown": s.get("shown", 0) if s else 0,
                "remembered": s.get("remembered", 0) if s else 0,
                "failed": s.get("failed", 0) if s else 0,
                "new": s is None,
            })

    total = len(due)
    return jsonify({"due": due[:limit], "count": total})


@bp.route('/api/kanji/<char>/reset-stats', methods=['POST'])
def api_kanji_reset_stats(char):
    if len(char) != 1 or not KANJI_RANGE_RE.match(char):
        return jsonify({"success": False, "message": "Invalid kanji character"}), 400

    db = load_kanji_db()
    if not any(k.get("kanji") == char for k in db.get("kanji", [])):
        return jsonify({"success": False, "message": "Kanji not found"}), 404

    stats = {}
    if os.path.exists(STATS_FILE) and os.path.getsize(STATS_FILE) > 0:
        with open(STATS_FILE, "r", encoding="utf-8") as f:
            try:
                stats = json.load(f)
            except json.JSONDecodeError:
                pass

    if char in stats:
        del stats[char]
        dir_name = os.path.dirname(STATS_FILE) or '.'
        import tempfile as _tempfile
        with _tempfile.NamedTemporaryFile('w', dir=dir_name, suffix='.tmp',
                                         delete=False, encoding='utf-8') as f:
            json.dump(stats, f, ensure_ascii=False, indent=2)
            f.flush()
            os.fsync(f.fileno())
            tmp_path = f.name
        os.replace(tmp_path, STATS_FILE)

    return jsonify({"success": True, "message": f"Stats reset for {char}"})


@bp.route('/api/jisho')
def api_jisho():
    keyword = request.args.get('keyword', '').strip()
    if not keyword:
        return jsonify({'error': 'keyword required'}), 400
    try:
        resp = requests.get(
            'https://jisho.org/api/v1/search/words',
            params={'keyword': keyword},
            timeout=8,
            headers={'User-Agent': 'xofkanji-pi/1.0'}
        )
        return jsonify(resp.json()), resp.status_code
    except requests.RequestException as e:
        print(f'Jisho API error: {e}')
        return jsonify({'error': 'Failed to reach Jisho API'}), 502


@bp.route('/upload', methods=['POST'])
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
