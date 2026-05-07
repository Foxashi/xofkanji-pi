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
echo "Setup complete. Run the project with: python3 main.py"
