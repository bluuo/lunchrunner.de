#!/bin/bash
set -euo pipefail

APP_DIR="$(pwd)"
BACKEND_DIR="$APP_DIR/backend"

if [ ! -d "$BACKEND_DIR" ]; then
  echo "[Plesk Deploy] Backend directory not found" >&2
  exit 1
fi

echo "[Plesk Deploy] Building Spring Boot backend"
mvn -f "$BACKEND_DIR/pom.xml" -B -DskipTests package

echo "[Plesk Deploy] Build complete. Flyway migrations will run on application startup."

if command -v systemctl >/dev/null 2>&1 && systemctl list-units --type=service | grep -q "lunchrunner"; then
  echo "[Plesk Deploy] Restarting systemd service lunchrunner"
  systemctl restart lunchrunner
else
  echo "[Plesk Deploy] Please restart the Java application via Plesk or your process manager."
fi
