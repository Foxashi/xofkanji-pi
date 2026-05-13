# xofkanji-pi

A Raspberry Pi-powered kanji learning display and companion dashboard built as a personal project and presented at school as a year-end showcase.

What started as "I wonder if I can show kanji on a small screen" turned into a full local-network web app with scanning, stats, themes, and practice modes. It runs on a Pi Zero 2 W sitting on my desk and has been a core part of my Japanese study routine.

As of 13.05.2026 I've presented this project at school. The verdict is... THAT IT'S AMAZING!!! (that's what the teachers said)


Updates in the future will bring more nice stuff from now on.

---

## How to setup the project

Simple! Just run this file:
```sh
./setup.sh
```

---

## How it looks

> *Screenshot below is slightly outdated the UI has come a long way since.*

<img width="700" alt="Display" src="https://github.com/user-attachments/assets/2a79e156-8d3c-4c03-ab60-91874cefb8a0" />

---

## What it does

- Displays a random kanji with its meanings, on'yomi/kun'yomi readings, and JLPT level
- Shows the currently playing (or last played) song via Last.fm integration
- Lets you scan kanji from photos books, manga, screenshots, anything
- Hosts a local dashboard accessible from any device on the network

---

## Hardware

| Part | Notes |
|------|-------|
| Raspberry Pi Zero 2 WH | Tight on resources, but it handles it |
| ELEGOO TFT touchscreen | Cheap and it works |
| Aluminium case + thermal pads | Keeps temps reasonable |
| Cable with ON/OFF switch | Quality of life |
| Random powerbank from a drawer | It charges, it runs |

<img width="500" alt="Hardware" src="https://github.com/user-attachments/assets/ed6b2b40-4598-497f-b176-aeca94e2e2bc" />

---

## Dashboard & Web Features

**Kanji Scanner** — Upload a photo of anything and it'll extract kanji from it.

<img width="1710" alt="Scanner" src="https://github.com/user-attachments/assets/77aca4a3-95d6-4b52-95f9-caac4163647c" />

**Dashboard** — Stats, recent scans, level progress, and more.

<img width="1710" alt="Dashboard" src="https://github.com/user-attachments/assets/59d9739e-a57a-44ac-b50e-b2b1955466f4" />

**Themes** — Customise the display colours. Create your own themes directly from the UI.

<img width="1710" alt="Themes" src="https://github.com/user-attachments/assets/290b4b50-f988-4972-8a78-ce8a44939889" />

**Practice Mode** — Type out on'yomi and kun'yomi readings from memory.

<img width="1710" alt="Practice" src="https://github.com/user-attachments/assets/e95d545f-6ffc-4bf8-a59c-455605844c37" />

---

## Stack

- **Python / Flask** — backend server and API
- **Vanilla JS** — frontend dashboard (no frameworks)
- **Pygame** — drives the Pi display
- **Last.fm API** — now playing integration
- **Raspbian** — to run everything

---

## What's next

This project is moving into its next phase. Some of these are already in progress:

- [ ] Migrate frontend to TypeScript
- [ ] Vocabulary generation from your personal kanji database
- [ ] Improved display layouts and transitions
- [ ] Better practice modes (stroke order, writing recognition)

