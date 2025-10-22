#!/bin/bash
set -euo pipefail

APP_DIR="$(pwd)"

if [ -d "$APP_DIR/backend" ]; then
  echo "[Plesk Deploy] Installing backend dependencies"
  npm install --production --prefix "$APP_DIR/backend"
  echo "[Plesk Deploy] Running database migrations"
  npm run migrate --prefix "$APP_DIR/backend"
  if command -v pm2 >/dev/null 2>&1; then
    echo "[Plesk Deploy] Restarting application via pm2"
    pm2 restart lunchrunner || pm2 start "$APP_DIR/backend/src/server.js" --name lunchrunner --interpreter node
  else
    echo "[Plesk Deploy] Please restart the Plesk Node app process"
  fi
else
  echo "[Plesk Deploy] Backend directory not found" >&2
  exit 1
fi
