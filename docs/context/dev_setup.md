# Entorno de desarrollo

Guía completa: `docs/guia_arranque.md`.

## Backend
- Carpeta: `/Users/maria/Desktop/Alvaro/Hermnet/backend/`
- Arranque: `./mvnw spring-boot:run` (puerto **8080**, bind `*:8080`)
- Requiere PostgreSQL local:
  - DB `hermnet_blind_db`, user `alvaro_admin` / pass `alvaro_admin` (ver `application.properties`).
  - Docker compose disponible: `backend/docker-compose.yml`.
- Firebase service account JSON en `backend/src/main/resources/`.
- Logs: `backend/logs/hermnet.log`.

## Frontend
- Carpeta: `/Users/maria/Desktop/Alvaro/Hermnet/frontend/`
- Arranque: `npx expo start` o `npx expo run:android` / `run:ios`.
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

## Git worktrees
Claude Code crea worktrees en `.claude/worktrees/`. **OJO**: si el usuario corre Expo desde `frontend/` (main), los cambios en el worktree NO aplican. Edita siempre `/Users/maria/Desktop/Alvaro/Hermnet/frontend/` directamente salvo que se esté trabajando explícitamente en la rama del worktree.
