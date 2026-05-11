#!/bin/bash

set -e

RUN_SETUP=false
if [[ "$1" == "--setup" ]]; then
    RUN_SETUP=true
fi

read -rp "Pi username [pi]: " PI_USER
PI_USER="${PI_USER:-pi}"

read -rp "Pi hostname (e.g. raspberrypi.local) [raspberrypi.local]: " PI_HOST
PI_HOST="${PI_HOST:-raspberrypi.local}"

if [[ "$PI_HOST" != *.* ]]; then
    PI_HOST="${PI_HOST}.local"
fi

REMOTE_DIR="${REMOTE_DIR:-~/xofkanji-pi}"

echo ""
echo "=== Deploying to ${PI_USER}@${PI_HOST}:${REMOTE_DIR} ==="

# Build TypeScript before deploying if tsc is available
if command -v tsc &> /dev/null; then
    echo "Building TypeScript..."
    npm run build
fi

rsync -avz --progress \
    --exclude='.git/' \
    --exclude='node_modules/' \
    --exclude='__pycache__/' \
    --exclude='*.pyc' \
    --exclude='.DS_Store' \
    --exclude='*.egg-info/' \
    --exclude='.env' \
    . "${PI_USER}@${PI_HOST}:${REMOTE_DIR}"

echo ""
echo "Sync complete."

if $RUN_SETUP; then
    echo ""
    echo "=== Running setup.sh on Pi ==="
    ssh "${PI_USER}@${PI_HOST}" "cd ${REMOTE_DIR} && bash setup.sh"
fi

echo ""
echo "Done. SSH in with: ssh ${PI_USER}@${PI_HOST}"
