#!/usr/bin/env python3
import json
import os
import pygame
from config import THEMES_FILE, SCREEN_WIDTH, SCREEN_HEIGHT

# ---------- FONT LOADING ----------
FONT_PATH = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"

def load_font(size):
    if os.path.exists(FONT_PATH):
        return pygame.font.Font(FONT_PATH, size)
    return pygame.font.Font(None, size)

# ---------- THEME SYSTEM ----------

def load_themes(path=THEMES_FILE):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return {}

THEMES = load_themes()
current_theme = THEMES.get("default", {})

def set_theme(name):
    global current_theme
    if name in THEMES:
        current_theme = THEMES[name]
        load_theme_assets()

def T(name, default):
    return tuple(current_theme.get(name, default))

# ---------- BACKGROUND IMAGE ----------
background_image = None

def load_theme_assets():
    global background_image

    img = current_theme.get("background_image")

    if img and os.path.exists(img):
        i = pygame.image.load(img).convert()
        background_image = pygame.transform.scale(i, (SCREEN_WIDTH, SCREEN_HEIGHT))
    else:
        background_image = None
