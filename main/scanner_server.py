#!/usr/bin/env python3
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from flask import Flask, jsonify
from py.config import DISPLAY_STATE_FILE
from py.backend.routes import views, kanji, lastfm, themes, daily
from py.backend.routes import display as display_routes
from py.backend.routes import settings as settings_routes

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
app = Flask(__name__,
            template_folder=os.path.join(_ROOT, 'templates'),
            static_folder=os.path.join(_ROOT, 'static'))
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10 MB

@app.errorhandler(413)
def request_entity_too_large(e):
    return jsonify({"success": False, "message": "File too large (max 10 MB)"}), 413

app.register_blueprint(views.bp)
app.register_blueprint(kanji.bp)
app.register_blueprint(lastfm.bp)
app.register_blueprint(themes.bp)
app.register_blueprint(display_routes.bp)
app.register_blueprint(daily.bp)
app.register_blueprint(settings_routes.bp)

if os.path.exists(DISPLAY_STATE_FILE):
    os.remove(DISPLAY_STATE_FILE)

# this port might be changed depending if I'm testing the website on the pi
# or directly on my computer just note that the default port is 5000
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9000, debug=False) 
