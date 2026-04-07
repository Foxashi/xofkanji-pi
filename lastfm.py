#!/usr/bin/env python3
import hashlib
import os
import ssl
import threading
import time
import urllib.request
import pygame
import pylast
from config import LASTFM_UPDATE_TIME

# ---------- LASTFM ----------
network = pylast.LastFMNetwork(
    api_key="",
    api_secret="",
    username=""
)

current_song = {"artist": "", "title": "", "is_playing": False, "album_art": None}
song_lock = threading.Lock()

ALBUM_ART_SIZE = 48
ALBUM_CACHE_DIR = "album_cache"
os.makedirs(ALBUM_CACHE_DIR, exist_ok=True)

ssl_context = ssl._create_unverified_context()

def download_and_load(url):
    if not url:
        return None

    name = hashlib.md5(url.encode()).hexdigest() + ".png"
    path = os.path.join(ALBUM_CACHE_DIR, name)

    if not os.path.exists(path):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, context=ssl_context, timeout=10) as r:
                open(path, "wb").write(r.read())
        except:
            return None

    try:
        img = pygame.image.load(path).convert_alpha()
        return pygame.transform.smoothscale(img, (ALBUM_ART_SIZE, ALBUM_ART_SIZE))
    except:
        return None

def get_album_art(track):
    try:
        album = track.get_album()
        if album:
            return download_and_load(album.get_cover_image(3))
    except:
        pass

    return None

def lastfm_thread():
    global current_song

    while True:
        try:
            user = network.get_user(network.username)
            now = user.get_now_playing()
            track = now or user.get_recent_tracks(limit=1)[0].track
            art = get_album_art(track)

            with song_lock:
                current_song = {
                    "artist": str(track.artist),
                    "title": str(track.title),
                    "is_playing": bool(now),
                    "album_art": art
                }

        except:
            pass

        time.sleep(LASTFM_UPDATE_TIME)

# Start the Last.fm thread
threading.Thread(target=lastfm_thread, daemon=True).start()
