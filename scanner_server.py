#!/usr/bin/env python3
import os
from flask import Flask
from py.config import DISPLAY_STATE_FILE
from py.backend.routes import views, kanji, lastfm, themes
from py.backend.routes import display as display_routes

app = Flask(__name__)
app.register_blueprint(views.bp)
app.register_blueprint(kanji.bp)
app.register_blueprint(lastfm.bp)
app.register_blueprint(themes.bp)
app.register_blueprint(display_routes.bp)

if os.path.exists(DISPLAY_STATE_FILE):
    os.remove(DISPLAY_STATE_FILE)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9000)
