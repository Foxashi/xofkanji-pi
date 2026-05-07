#!/usr/bin/env python3
import os

# ---------- FORCE X11 ----------
os.environ["DISPLAY"] = ":0"
# for some reason the touchscreen I'm using on the GPIO pins doesn't work with wayland so I have to force xorg to run the app properly

# ---------- CONFIG ----------
SCREEN_WIDTH = 480
SCREEN_HEIGHT = 320

KANJI_CHANGE_TIME = 900
LASTFM_UPDATE_TIME = 10

FAILED_INTERVAL = 15 * 60
MAX_INTERVAL = 7 * 24 * 3600

KANJI_RELOAD_INTERVAL = 30
THEME_RELOAD_INTERVAL = 5

STATS_FILE = "db/stats.json"
KANJI_FILE = "db/kanji.json"
THEMES_FILE = "db/themes.json"
LASTFM_CONFIG_FILE = "db/lastfm_config.json"
DISPLAY_STATE_FILE = "display_state.json"
THEME_STATE_FILE = "theme_state.json"

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
