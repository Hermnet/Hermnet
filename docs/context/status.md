# Estado actual y pendiente

Última revisión: 2026-04-15. Actualizar al completar tareas.

## Implementado
### Backend
- Auth completo: `/api/auth/register`, `/challenge`, `/login` con JWT HS256 (incluye claim `jti`).
- Refresh / logout: `/api/auth/refresh`, `/api/auth/logout` revocan el `jti` actual via `TokenBlacklistService`.
- Mensajería: `POST /api/messages`, `GET /api/messages?myId=...`, `POST /api/messages/ack` (borra mensajes del usuario autenticado, opcional `cutoff`).
- Filtros: anonimización IP, rate limit, JWT (consulta blacklist).
- `DataRetentionScheduler` (limpieza cron de buzones, challenges y blacklist).
- Integración Firebase FCM (`NotificationService`).
- `jwt.secret` validado en arranque (≥256 bits, fail-fast); override por env `JWT_SECRET`.

### Frontend
- Identity generation + SecureStore persistence.
- PIN setup / login con hash local.
- Home → PIN → LoadingScreen → mailbox/ChatsScreen navegación.
- ApiClient con autodetección de URL y re-auth en 401.
- QR sharing / scanner (`ShowQRScreen`, `QRScannerScreen`).
- Ajustes (sub-pantallas Security, Privacy, Notifications, etc.).
- NetInfo wrapper.

## Pendiente / por verificar
- [x] ~~**ACK de mensajes**~~ → añadido `POST /api/messages/ack` (cutoff opcional). Falta cliente: que `MessageFlowService` lo invoque tras procesar.
- [x] ~~**Refresh token / rotación**~~ → backend listo (`POST /api/auth/refresh`). Falta cliente: silent refresh periódico antes de expirar.
- [x] **Chat flow real** en `ChatRoomScreen`: integración E2E con `MessageFlowService` (envío + recepción + dedup + estados pending/sent/failed + reintento).
- [x] ~~**Recovery file .hnet**~~: implementado `RecoveryService.ts` (export/import con PBKDF2 + AES-256-GCM). `TransferScreen` y `HomeScreen` integrados con picker de archivos y diálogo de contraseña.
- ~~**The Bridge (PC P2P)**~~: fuera del alcance del TFG.
- [ ] **Tests frontend**: cobertura parcial; revisar y ampliar (backend ya en 121 tests verdes).
- [x] ~~**CORS / hardening producción**~~: `jwt.secret` lee de env `JWT_SECRET` (fail-fast si vacío); DB credentials externalizadas; CORS configurable vía `CORS_ALLOWED_ORIGINS`.
- [x] ~~**Settings funcionales**~~: todas las sub-pantallas son funcionales (Accessibility usa contexto real, Help tiene FAQ + mailto, Terms es contenido estático, Transfer integra RecoveryService).
- [x] ~~**Limpiar warning SecureStore >2048 bytes**~~: resuelto en commit 73a3220 (identidad dividida en 3 keys separadas, cada una <2048 B).

## Bugs conocidos
- Ver `recent_fixes.md` (arreglados).
