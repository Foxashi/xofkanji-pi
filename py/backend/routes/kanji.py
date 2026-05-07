import json
import os
import random
import time
from flask import Blueprint, jsonify, request
from PIL import Image
from py.config import STATS_FILE
from py.backend.db import load_kanji_db, save_kanji_db
from py.backend.ocr import extract_kanji_from_image, fetch_kanji_info

bp = Blueprint('kanji', __name__)


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
