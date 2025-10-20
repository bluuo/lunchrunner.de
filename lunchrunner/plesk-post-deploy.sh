#!/bin/bash
set -euo pipefail

APP_DIR="$(pwd)"

if [ -d "$APP_DIR/backend" ]; then
  echo "[Plesk Deploy] Installiere Backend-Abhängigkeiten"
  npm install --production --prefix "$APP_DIR/backend"
  echo "[Plesk Deploy] Führe Datenbankmigrationen aus"
  npm run migrate --prefix "$APP_DIR/backend"
  if command -v pm2 >/dev/null 2>&1; then
    echo "[Plesk Deploy] Starte Anwendung über pm2 neu"
    pm2 restart lunchrunner || pm2 start "$APP_DIR/backend/src/server.js" --name lunchrunner --interpreter node
  else
    echo "[Plesk Deploy] Bitte Plesk Node-App Prozess neu starten"
  fi
else
  echo "[Plesk Deploy] Backend-Verzeichnis nicht gefunden" >&2
  exit 1
fi
