#!/usr/bin/env python3
import os
import pygame
from config import SCREEN_WIDTH, SCREEN_HEIGHT
from themes import T, current_theme, load_font

# ---------- PYGAME UTILITIES ----------

def theme_font(name, default):
    return load_font(current_theme.get(name, default))

def truncate_text(t, f, w):
    if f.size(t)[0] <= w:
        return t

    while f.size(t + "...")[0] > w:
        t = t[:-1]

    return t + "..."
