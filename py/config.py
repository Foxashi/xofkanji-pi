#!/usr/bin/env python3
import json
import os

# ---------- FORCE X11 ----------
os.environ["DISPLAY"] = ":0"
# for some reason the touchscreen I'm using on the GPIO pins doesn't work with wayland so I have to force xorg to run the app properly

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# screen's loaded from settings.json so it no longer needs hardcoding here
# (actual values are set below after settings load)

# ---------- PATHS ----------
STATS_FILE = os.path.join(_ROOT, "db", "stats.json")
KANJI_FILE = os.path.join(_ROOT, "db", "kanji.json")
THEMES_FILE = os.path.join(_ROOT, "db", "themes.json")
LASTFM_CONFIG_FILE = os.path.join(_ROOT, "db", "lastfm_config.json")
SETTINGS_FILE = os.path.join(_ROOT, "db", "settings.json")
DISPLAY_STATE_FILE = os.path.join(_ROOT, "display_state.json")
THEME_STATE_FILE = os.path.join(_ROOT, "theme_state.json")

# ---------- TIMING (loaded from settings.json with defaults as fallback) ----------
_settings = {}
if os.path.exists(SETTINGS_FILE):
    try:
        with open(SETTINGS_FILE, "r") as _f:
            _settings = json.load(_f)
    except (json.JSONDecodeError, OSError):
        pass

SCREEN_WIDTH  = int(_settings.get("screen_width",  480))
SCREEN_HEIGHT = int(_settings.get("screen_height", 320))

KANJI_CHANGE_TIME     = int(_settings.get("kanji_change_time", 900))
LASTFM_UPDATE_TIME    = int(_settings.get("lastfm_update_time", 10))
FAILED_INTERVAL       = int(_settings.get("failed_interval", 15 * 60))
MAX_INTERVAL          = int(_settings.get("max_interval", 7 * 24 * 3600))
KANJI_RELOAD_INTERVAL = int(_settings.get("kanji_reload_interval", 30))
THEME_RELOAD_INTERVAL = int(_settings.get("theme_reload_interval", 5))
SRS_EASE_FACTOR       = float(_settings.get("srs_ease_factor", 2.0))

# ---------- DEFAULT COLORS ----------
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
DARK_GRAY = (40, 40, 40)
MEDIUM_GRAY = (80, 80, 80)
LIGHT_GRAY = (150, 150, 150)

GREEN = (50, 205, 50)
BLUE = (30, 144, 255)
YELLOW = (255, 215, 0)
ORANGE = (255, 140, 0)

LEVEL_COLORS = {"N5": GREEN, "N4": BLUE, "N3": YELLOW, "N2": ORANGE, "N1": (255, 50, 50)}
