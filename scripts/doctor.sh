#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PASS=0
WARN=0
FAIL=0

ok() { PASS=$((PASS + 1)); echo -e "${GREEN}✓${NC} $1"; }
warn() { WARN=$((WARN + 1)); echo -e "${YELLOW}!${NC} $1"; }
bad() { FAIL=$((FAIL + 1)); echo -e "${RED}✗${NC} $1"; }

has_cmd() {
  command -v "$1" >/dev/null 2>&1
}

check_cmd() {
  local cmd="$1"
  local label="$2"
  if has_cmd "$cmd"; then ok "$label"; else bad "$label no encontrado"; fi
}

echo "Hermnet doctor"
echo "=============="

check_cmd node "Node.js"
check_cmd npm "npm"
check_cmd java "Java"
check_cmd mvn "Maven"
check_cmd docker "Docker"

if has_cmd docker; then
  if docker info >/dev/null 2>&1; then ok "Docker Desktop activo"; else bad "Docker instalado pero no activo"; fi
fi

if has_cmd adb; then
  ok "Android adb"
  ADB_OUTPUT="$(adb devices 2>/dev/null || true)"
  if echo "$ADB_OUTPUT" | grep -q "device$"; then
    ok "Android device/emulador conectado"
  else
    warn "No hay Android device/emulador conectado"
  fi
else
  warn "adb no encontrado; Android no está listo en esta máquina"
fi

if has_cmd xcodebuild; then ok "Xcode"; else warn "Xcode no encontrado; iOS no está listo en esta máquina"; fi

if [ -f "backend/.env" ]; then ok "backend/.env"; else bad "Falta backend/.env"; fi
if [ -f "frontend/.env" ]; then ok "frontend/.env"; else bad "Falta frontend/.env"; fi
if [ -d "frontend/node_modules" ]; then ok "frontend/node_modules"; else bad "Falta frontend/node_modules; ejecuta bash scripts/bootstrap.sh"; fi

FIREBASE_JSON="backend/src/main/resources/hermnet-6d85d-firebase-adminsdk-fbsvc-fdf1bb4af7.json"
if [ -f "$FIREBASE_JSON" ]; then
  ok "Firebase JSON"
else
  warn "Firebase JSON ausente; backend arrancará, pero sin push notifications"
fi

if lsof -nP -iTCP:8080 -sTCP:LISTEN >/dev/null 2>&1; then warn "Puerto 8080 ocupado"; else ok "Puerto 8080 libre"; fi
if lsof -nP -iTCP:8081 -sTCP:LISTEN >/dev/null 2>&1; then warn "Puerto 8081 ocupado"; else ok "Puerto 8081 libre"; fi

echo ""
echo "Resultado: ${PASS} OK, ${WARN} avisos, ${FAIL} errores"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
