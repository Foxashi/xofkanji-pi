from datetime import date
from flask import Blueprint, jsonify
from py.backend.db import load_kanji_db

bp = Blueprint('daily', __name__)


@bp.route('/api/daily')
def api_daily():
    today = date.today()
    seed = today.toordinal()

    db = load_kanji_db()
    kanji_list = db.get("kanji", [])
    kanji_entry = kanji_list[seed % len(kanji_list)] if kanji_list else None

    return jsonify({"kanji": kanji_entry})
