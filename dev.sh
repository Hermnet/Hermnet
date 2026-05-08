#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# dev.sh — Levanta todo el entorno de desarrollo de Hermnet
#
# Uso:
#   bash dev.sh          → backend + Metro (para Android emulador + iPhone)
#   bash dev.sh backend  → solo backend (Docker + Spring Boot)
#   bash dev.sh metro    → solo Metro (dev client)
#   bash dev.sh ios      → prebuild + run en iPhone físico
#   bash dev.sh android  → prebuild + run en Android emulador
# ─────────────────────────────────────────────────────────────────
set -euo pipefail
cd "$(dirname "$0")"

# ── Colores ──
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# ── Detectar IP local ──
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")
echo -e "${GREEN}📡 IP local: ${LOCAL_IP}${NC}"

# ── Actualizar .env del frontend con la IP ──
FRONTEND_ENV="frontend/.env"
if [ -f "$FRONTEND_ENV" ]; then
    # Reemplazar o añadir EXPO_PUBLIC_DEV_MACHINE_IP
    if grep -q "EXPO_PUBLIC_DEV_MACHINE_IP" "$FRONTEND_ENV"; then
        sed -i '' "s|EXPO_PUBLIC_DEV_MACHINE_IP=.*|EXPO_PUBLIC_DEV_MACHINE_IP=${LOCAL_IP}|" "$FRONTEND_ENV"
    else
        echo "EXPO_PUBLIC_DEV_MACHINE_IP=${LOCAL_IP}" >> "$FRONTEND_ENV"
    fi
else
    echo "EXPO_PUBLIC_DEV_MACHINE_IP=${LOCAL_IP}" > "$FRONTEND_ENV"
fi
echo -e "${GREEN}✅ frontend/.env actualizado con IP ${LOCAL_IP}${NC}"

# ── Funciones ──
start_backend() {
    echo -e "${YELLOW}🐘 Arrancando PostgreSQL (Docker)...${NC}"
    cd backend
    if [ ! -f .env ]; then
        echo -e "${RED}❌ Falta backend/.env — copia de ejemplo:${NC}"
        echo "   JWT_SECRET=clave-super-secreta-de-al-menos-32-caracteres"
        echo "   DB_URL=jdbc:postgresql://localhost:5432/hermnet_blind_db"
        echo "   DB_USERNAME=alvaro_admin"
        echo "   DB_PASSWORD=alvaro_admin"
        exit 1
    fi
    docker compose up -d
    echo -e "${YELLOW}☕ Arrancando Spring Boot...${NC}"
    set -a; . ./.env; set +a
    mvn spring-boot:run &
    BACKEND_PID=$!
    cd ..
    echo -e "${GREEN}✅ Backend corriendo (PID ${BACKEND_PID}) en http://${LOCAL_IP}:8080${NC}"
}

start_metro() {
    echo -e "${YELLOW}📱 Arrancando Metro (dev client)...${NC}"
    cd frontend
    npx expo start --dev-client
}

run_ios() {
    echo -e "${YELLOW}🍎 Construyendo para iOS (dispositivo físico)...${NC}"
    cd frontend
    npx expo run:ios --device
}

run_android() {
    echo -e "${YELLOW}🤖 Construyendo para Android...${NC}"
    cd frontend
    npx expo run:android
}

# ── Main ──
case "${1:-all}" in
    backend)
        start_backend
        wait
        ;;
    metro)
        start_metro
        ;;
    ios)
        run_ios
        ;;
    android)
        run_android
        ;;
    all)
        echo -e "${GREEN}═══════════════════════════════════════${NC}"
        echo -e "${GREEN}  Hermnet Dev Environment${NC}"
        echo -e "${GREEN}  Backend: http://${LOCAL_IP}:8080${NC}"
        echo -e "${GREEN}  Metro:   http://${LOCAL_IP}:8081${NC}"
        echo -e "${GREEN}═══════════════════════════════════════${NC}"
        echo ""
        start_backend
        sleep 5
        start_metro
        ;;
    *)
        echo "Uso: bash dev.sh [backend|metro|ios|android|all]"
        exit 1
        ;;
esac
