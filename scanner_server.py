#!/usr/bin/env python3
import os
import json
import re
import requests
import time
from flask import Flask, request, jsonify, render_template
from PIL import Image, ImageEnhance
import pytesseract

app = Flask(__name__)
KANJI_FILE = "kanji.json"

def load_kanji_db():
    # Check if the file exists AND if it actually has content inside it
    if os.path.exists(KANJI_FILE) and os.path.getsize(KANJI_FILE) > 0:
        try:
            with open(KANJI_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                # If the file just has {} inside it, make sure we add the "kanji" list
                if "kanji" not in data:
                    data["kanji"] = []
                return data
        except json.JSONDecodeError:
            # If the file is broken or just has empty spaces, reset it safely
            return {"kanji": []}
            
    # If the file doesn't exist at all or is 0 bytes, return the default format
    return {"kanji": []}

def save_kanji_db(db):
    with open(KANJI_FILE, "w", encoding="utf-8") as f:
        json.dump(db, f, ensure_ascii=False, indent=2)

def extract_kanji_from_image(image, direction="horizontal"):
    # 1. PREPROCESSING
    img = image.convert('L')
    img = ImageEnhance.Contrast(img).enhance(2.5)
    img = ImageEnhance.Sharpness(img).enhance(2.0)
    img = img.point(lambda p: p > 140 and 255)

    # 2. CONFIG & LANGUAGE
    if direction == 'vertical':
        custom_config = '--psm 5'
        lang_pack = 'jpn_vert' # Use the dedicated vertical pack!
    else:
        custom_config = '--psm 3'
        lang_pack = 'jpn'
    
    # Run Tesseract with the correct language pack
    raw_text = pytesseract.image_to_string(img, lang=lang_pack, config=custom_config)
    
    print("\n--- RAW OCR OUTPUT ---")
    print(raw_text)
    print("----------------------\n")
    
    # 3. REGEX (Kanji only)
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

            # Grab only the top 2 readings and top 3 meanings using Python slicing [:n]
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

@app.route('/')
def index():
    return render_template('index.html')
    

@app.route('/upload', methods=['POST'])
def upload_image():
    # Start the stopwatch!
    start_time = time.time()

    if 'image' not in request.files:
        return jsonify({"success": False, "message": "No image uploaded"}), 400

    file = request.files['image']
    direction = request.form.get('direction', 'horizontal')
    
    if file.filename == '':
        return jsonify({"success": False, "message": "No file selected"}), 400

    try:
        img = Image.open(file)
        
        # 1. Scan the image
        found_kanji = extract_kanji_from_image(img, direction)

        if not found_kanji:
            elapsed = time.time() - start_time
            return jsonify({
                "success": False, 
                "message": "No Kanji found in the image",
                "time": round(elapsed, 2)
            }), 200

        # 2. Check the database
        db = load_kanji_db()
        existing_kanji = {k["kanji"] for k in db["kanji"]}

        # 3. Process and fetch meanings for new Kanji
        added_kanji = []
        for char in found_kanji:
            if char not in existing_kanji:
                info = fetch_kanji_info(char)
                if info:
                    db["kanji"].append(info)
                    added_kanji.append(char)
                    existing_kanji.add(char)

        # Stop the stopwatch!
        elapsed = time.time() - start_time

        # 4. Save and return results with the elapsed time
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
