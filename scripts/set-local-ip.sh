#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

IP=$(ipconfig getifaddr en0)
if [ -z "$IP" ]; then
  echo "No se encontró IP en en0. ¿Estás conectado al WiFi?"
  exit 1
fi

FRONTEND_ENV="frontend/.env"
if [ -f "$FRONTEND_ENV" ]; then
  if grep -q "EXPO_PUBLIC_DEV_MACHINE_IP" "$FRONTEND_ENV"; then
    sed -i '' "s|EXPO_PUBLIC_DEV_MACHINE_IP=.*|EXPO_PUBLIC_DEV_MACHINE_IP=$IP|" "$FRONTEND_ENV"
  else
    echo "EXPO_PUBLIC_DEV_MACHINE_IP=$IP" >> "$FRONTEND_ENV"
  fi
else
  echo "EXPO_PUBLIC_DEV_MACHINE_IP=$IP" > "$FRONTEND_ENV"
fi

echo "IP local actualizada a $IP"
