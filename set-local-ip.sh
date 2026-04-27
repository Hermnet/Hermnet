#!/bin/bash
IP=$(ipconfig getifaddr en0)
if [ -z "$IP" ]; then
  echo "No se encontró IP en en0. ¿Estás conectado al WiFi?"
  exit 1
fi
sed -i '' "s|EXPO_PUBLIC_API_BASE_URL=.*|EXPO_PUBLIC_API_BASE_URL=http://$IP:8080|" frontend/.env
echo "API URL actualizada a http://$IP:8080"
