#!/usr/bin/env python3
import re
import requests
from PIL import ImageEnhance
import pytesseract


def extract_kanji_from_image(image, direction="horizontal"):
    img = image.convert('L')
    img = ImageEnhance.Contrast(img).enhance(2.5)
    img = ImageEnhance.Sharpness(img).enhance(2.0)
    img = img.point(lambda p: p > 140 and 255)

    if direction == 'vertical':
        custom_config = '--psm 5'
        lang_pack = 'jpn_vert'
    else:
        custom_config = '--psm 3'
        lang_pack = 'jpn'

    raw_text = pytesseract.image_to_string(img, lang=lang_pack, config=custom_config)
    kanji_chars = re.findall(r'[\u4E00-\u9FFF]', raw_text)
    return list(set(kanji_chars))


def fetch_kanji_info(kanji_char):
    try:
        url = f"https://kanjiapi.dev/v1/kanji/{kanji_char}"
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            jlpt = data.get("jlpt")
            level_str = f"N{jlpt}" if jlpt else "Unknown"

            top_onyomi = data.get("on_readings", [])[:2]
            top_kunyomi = data.get("kun_readings", [])[:2]
            top_meanings = data.get("meanings", [])[:3]

            return {
                "kanji": kanji_char,
                "onyomi": "・".join(top_onyomi),
                "kunyomi": "・".join(top_kunyomi),
                "meaning": ", ".join(top_meanings),
                "level": level_str
            }
    except Exception as e:
        print(f"Error fetching {kanji_char}: {e}")
    return None
