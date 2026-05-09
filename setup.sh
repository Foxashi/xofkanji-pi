#!/bin/bash

set -e

echo "=== xofkanji-pi setup ==="

if command -v pacman &> /dev/null; then
    echo "Detected Arch-based system..."
    PACKAGES="python-flask python-pygame python-pylast python-werkzeug python-requests python-pillow python-pytesseract tesseract"
    if command -v yay &> /dev/null; then
        yay -S --needed $PACKAGES
    else
        sudo pacman -S --needed $PACKAGES
    fi

elif command -v apt &> /dev/null; then
    echo "Detected Debian-based system..."
    sudo apt update
    sudo apt install -y python3-pip tesseract-ocr
    pip3 install -r requirements.txt

else
    echo "Unsupported package manager. Install dependencies manually using requirements.txt"
    exit 1
fi

echo ""
echo "=== Installing Node.js dependencies ==="

if command -v node &> /dev/null; then
    npm install
    npm run build
    echo "TypeScript compiled successfully."
else
    echo "Node.js not found — skipping TypeScript build. Install Node.js and run 'npm install && npm run build' manually."
fi

echo ""
echo "Setup complete. Run the project with: python3 main/main.py (for the kanji display) or python3 main/scanner_server.py (for the web server)"
