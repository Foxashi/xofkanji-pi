#!/usr/bin/env python3
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from flask import Flask
from py.config import DISPLAY_STATE_FILE
from py.backend.routes import views, kanji, lastfm, themes
from py.backend.routes import display as display_routes

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
app = Flask(__name__,
            template_folder=os.path.join(_ROOT, 'templates'),
            static_folder=os.path.join(_ROOT, 'static'))
app.register_blueprint(views.bp)
app.register_blueprint(kanji.bp)
app.register_blueprint(lastfm.bp)
app.register_blueprint(themes.bp)
app.register_blueprint(display_routes.bp)

if os.path.exists(DISPLAY_STATE_FILE):
    os.remove(DISPLAY_STATE_FILE)

# this port might be changed depending if I'm testing the website on the pi
# or directly on my computer just note that the default port is 5000
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9000) 
