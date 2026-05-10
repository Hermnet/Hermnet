#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info() { echo -e "${YELLOW}==>${NC} $1"; }
ok() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}!${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; exit 1; }

local_ip() {
  ipconfig getifaddr en0 2>/dev/null \
    || ipconfig getifaddr en1 2>/dev/null \
    || echo "localhost"
}

ensure_file_from_example() {
  local example="$1"
  local target="$2"
  if [ -f "$target" ]; then
    ok "$target ya existe"
    return
  fi
  if [ ! -f "$example" ]; then
    fail "Falta $example"
  fi
  cp "$example" "$target"
  ok "Creado $target desde $example"
}

upsert_env_var() {
  local file="$1"
  local key="$2"
  local value="$3"
  if grep -q "^${key}=" "$file"; then
    sed -i '' "s|^${key}=.*|${key}=${value}|" "$file"
  else
    printf '\n%s=%s\n' "$key" "$value" >> "$file"
  fi
}

info "Preparando archivos .env"
ensure_file_from_example "backend/.env.example" "backend/.env"
ensure_file_from_example "frontend/.env.example" "frontend/.env"

IP="$(local_ip)"
upsert_env_var "frontend/.env" "EXPO_PUBLIC_DEV_MACHINE_IP" "$IP"
ok "frontend/.env actualizado con EXPO_PUBLIC_DEV_MACHINE_IP=$IP"

FIREBASE_JSON="backend/src/main/resources/hermnet-6d85d-firebase-adminsdk-fbsvc-fdf1bb4af7.json"
if [ -f "$FIREBASE_JSON" ]; then
  ok "Firebase JSON encontrado"
else
  warn "Firebase JSON no encontrado. El backend arrancará sin push notifications."
  warn "Cuando lo descargues de Drive, colócalo en:"
  warn "  $FIREBASE_JSON"
fi

info "Instalando dependencias del frontend"
if [ -d "frontend/node_modules" ]; then
  ok "frontend/node_modules ya existe"
else
  (cd frontend && npm install)
  ok "Dependencias frontend instaladas"
fi

info "Comprobando herramientas principales"
command -v node >/dev/null || fail "Node.js no está instalado"
command -v npm >/dev/null || fail "npm no está instalado"
command -v java >/dev/null || fail "Java no está instalado"
command -v mvn >/dev/null || fail "Maven no está instalado"
command -v docker >/dev/null || fail "Docker no está instalado"
ok "Herramientas base encontradas"

if docker info >/dev/null 2>&1; then
  ok "Docker está activo"
else
  warn "Docker está instalado pero no parece estar abierto. Abre Docker Desktop antes de arrancar backend."
fi

echo ""
ok "Bootstrap completado"
echo ""
echo "Siguiente paso recomendado:"
echo "  bash scripts/doctor.sh"
echo ""
echo "Arranque habitual:"
echo "  bash dev.sh backend   # terminal 1"
echo "  bash dev.sh metro     # terminal 2"
echo "  bash dev.sh android   # opcional, si necesitas compilar Android"
echo "  bash dev.sh ios       # opcional, si necesitas compilar iPhone"
