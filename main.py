#!/usr/bin/env python3
import argparse
import math
import pygame
import time
from datetime import datetime

from config import (
    SCREEN_WIDTH, SCREEN_HEIGHT, KANJI_CHANGE_TIME, THEME_RELOAD_INTERVAL,
    KANJI_RELOAD_INTERVAL, FAILED_INTERVAL, MAX_INTERVAL, BLACK, DARK_GRAY,
    MEDIUM_GRAY, WHITE, YELLOW, GREEN, BLUE, LIGHT_GRAY, LEVEL_COLORS
)
import themes
from themes import T, set_theme, load_themes
from stats import load_stats, save_stats
from kanji import load_kanji, pick_due_kanji
from pygame_utils import theme_font, truncate_text, load_font
import lastfm
from lastfm import ALBUM_ART_SIZE

# ---------- ARGUMENTS ----------
parser = argparse.ArgumentParser()
parser.add_argument("--theme", help="Set theme")
args = parser.parse_args()

if args.theme:
    set_theme(args.theme)

# ---------- INITIALIZE ----------
stats = load_stats()
KANJI_LIST = load_kanji()
last_reload = time.time()

# Load initial theme assets
themes.load_theme_assets()

# Initialize Pygame
pygame.init()
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.NOFRAME)
pygame.mouse.set_visible(False)
clock = pygame.time.Clock()

# Load fonts
KANJI_FONT = theme_font("kanji_font_size", 140)
READING_FONT = theme_font("reading_font_size", 20)
MEANING_FONT = theme_font("meaning_font_size", 22)
SMALL_FONT = load_font(18)
TIME_FONT = load_font(20)
STATUS_FONT = load_font(18)

# ---------- MAIN ----------
if not KANJI_LIST:
    print("No kanji loaded.")
    exit()

theme_names = list(themes.THEMES.keys())
theme_index = 0

current = pick_due_kanji(KANJI_LIST, stats)
stats[current["kanji"]]["shown"] += 1
save_stats(stats)

last_change = time.time()
last_theme_reload = time.time()

running = True

while running:
    # ---------- HOT RELOAD THEMES ----------
    if time.time() - last_theme_reload > THEME_RELOAD_INTERVAL:
        themes.THEMES = load_themes()
        last_theme_reload = time.time()

    # ---------- HOT RELOAD KANJI ----------
    if time.time() - last_reload > KANJI_RELOAD_INTERVAL:
        new_list = load_kanji()
        if len(new_list) != len(KANJI_LIST):
            KANJI_LIST = new_list
        last_reload = time.time()

    for e in pygame.event.get():
        if e.type in (pygame.MOUSEBUTTONDOWN, pygame.FINGERDOWN):
            s = stats[current["kanji"]]
            s["remembered"] += 1
            s["interval"] = min(s["interval"] * 2, MAX_INTERVAL)
            s["due"] = time.time() + s["interval"]

            save_stats(stats)

            current = pick_due_kanji(KANJI_LIST, stats)
            stats[current["kanji"]]["shown"] += 1
            save_stats(stats)

            last_change = time.time()

        elif e.type == pygame.KEYDOWN:
            if e.key == pygame.K_ESCAPE:
                running = False

            elif e.key == pygame.K_t:
                theme_index = (theme_index + 1) % len(theme_names)
                set_theme(theme_names[theme_index])

    if time.time() - last_change > KANJI_CHANGE_TIME:
        s = stats[current["kanji"]]
        s["failed"] += 1
        s["interval"] = FAILED_INTERVAL
        s["due"] = time.time() + FAILED_INTERVAL

        save_stats(stats)

        current = pick_due_kanji(KANJI_LIST, stats)
        stats[current["kanji"]]["shown"] += 1
        save_stats(stats)

        last_change = time.time()

    # ---------- DRAW ----------
    if themes.background_image:
        screen.blit(themes.background_image, (0, 0))
    else:
        screen.fill(T("background", BLACK))

    pygame.draw.rect(
        screen,
        T("top_bar", DARK_GRAY),
        (0, 0, SCREEN_WIDTH, 37),
        border_top_left_radius=0,
        border_top_right_radius=0,
        border_bottom_left_radius=14,
        border_bottom_right_radius=14
    )

    screen.blit(
        TIME_FONT.render(datetime.now().strftime("%H:%M"), True, T("time", YELLOW)),
        (SCREEN_WIDTH - 55, 5)
    )

    lvl = current.get("level", "N5")

    screen.blit(
        STATUS_FONT.render(f"JLPT {lvl}", True, LEVEL_COLORS.get(lvl, WHITE)),
        (10, 8)
    )

    ksurf = KANJI_FONT.render(current["kanji"], True, T("kanji", WHITE))

    screen.blit(
        ksurf,
        ksurf.get_rect(center=(SCREEN_WIDTH // 2, 100))
    )

    screen.blit(
        READING_FONT.render(f"On: {current.get('onyomi', '')}", True, T("onyomi", GREEN)),
        (20, 180)
    )

    k = READING_FONT.render(
        f"Kun: {current.get('kunyomi', '')}",
        True,
        T("kunyomi", BLUE)
    )

    screen.blit(k, (SCREEN_WIDTH - k.get_width() - 20, 180))

    m = truncate_text(
        f"Meaning: {current.get('meaning', '')}",
        MEANING_FONT,
        SCREEN_WIDTH - 40
    )

    screen.blit(
        MEANING_FONT.render(m, True, T("meaning", YELLOW)),
        ((SCREEN_WIDTH - MEANING_FONT.size(m)[0]) // 2, 210)
    )

    pygame.draw.line(
        screen,
        T("divider", MEDIUM_GRAY),
        (20, 244),
        (SCREEN_WIDTH - 20, 244),
        2
    )

    # ---------- MUSIC ----------
    with lastfm.song_lock:
        song = lastfm.current_song.copy()

    x = 30
    y = 255

    if song["album_art"]:
        screen.blit(song["album_art"], (20, y))
        x = 20 + ALBUM_ART_SIZE + 10

    if song["title"]:
        txt = f"{truncate_text(song['artist'], SMALL_FONT, 180)} - {truncate_text(song['title'], SMALL_FONT, 180)}"

        screen.blit(
            SMALL_FONT.render(
                txt,
                True,
                T("music_playing", GREEN) if song["is_playing"] else T("music_paused", LIGHT_GRAY)
            ),
            (x, y + 14)
        )


    pygame.display.update()
    clock.tick(15)

pygame.quit()
