# Entorno de desarrollo

Guía completa: `docs/guia_arranque.md`.

## Backend
- Carpeta: `backend/` (raíz del repositorio)
- Arranque: `./mvnw spring-boot:run` (puerto **8080**, bind `*:8080`)
- Requiere PostgreSQL local:
  - DB `hermnet_blind_db`, user `alvaro_admin` / pass `alvaro_admin` (ver `application.properties`).
  - Docker compose disponible: `backend/docker-compose.yml`.
- Variables de entorno requeridas en producción:
  - `JWT_SECRET` — obligatorio, ≥32 bytes. Sin definir → fail-fast al arrancar.
  - `CORS_ALLOWED_ORIGINS` — orígenes permitidos (ej. `https://app.hermnet.io`).
  - `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` — conexión PostgreSQL.
- Firebase service account JSON en `backend/src/main/resources/`.
- Logs: `backend/logs/hermnet.log`.

## Frontend
- Carpeta: `frontend/` (raíz del repositorio)
- Arranque: `npx expo start` o `npx expo run:android` / `run:ios`.
- **Nota:** Se usan development builds (no Expo Go) por dependencia de `react-native-quick-crypto` (módulo nativo).
- Emulador Android API 36 configurado (Medium_Phone_API_36).
- URL backend: **autodetectada** por `ApiClient.ts`:
  1. `EXPO_PUBLIC_API_BASE_URL` si está definida.
  2. IP LAN de Metro (`Constants.expoConfig.hostUri`).
  3. `10.0.2.2:8080` en emulador Android.
  4. `localhost:8080` fallback.
- Al iniciar verás `LOG [ApiClient] Using backend URL: ...`.

## Tips
- Si cambias `jwt.secret` o config del back, **reinicia Spring Boot**.
- Si no aplican cambios en front, en Metro: `r` para reload, `shift+r` para reset cache.
- `expo start -c` limpia cache al arrancar.
- La PEM de la clave privada RSA-2048 ocupa ~1700 bytes en SecureStore — dentro del límite recomendado de 2048 bytes.

## Git worktrees
Claude Code crea worktrees en `.claude/worktrees/`. **OJO**: si el usuario corre Expo desde `frontend/` (main), los cambios en el worktree NO aplican. Edita siempre en la carpeta `frontend/` del directorio principal del proyecto salvo que se esté trabajando explícitamente en la rama del worktree.
