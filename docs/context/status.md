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
- [ ] **Recovery file .hnet**: flujo de exportar/importar bóveda (hoy `HomeScreen.handleRestoreClick` está simulado con `Alert`).
- [ ] **Auto-destrucción tras N PIN fallidos**: no implementado todavía.
- [ ] **The Bridge (PC P2P)**: documentado, no iniciado.
- [ ] **Tests frontend**: cobertura parcial; revisar y ampliar (backend ya en 121 tests verdes).
- [ ] **CORS / hardening producción**: definir `JWT_SECRET` real en env; revisar CORS.
- [ ] **Settings funcionales**: comprobar qué sub-pantallas de settings son mockups y cuáles ya hacen algo.
- [ ] **Limpiar warning SecureStore >2048 bytes**: identidad serializada excede límite recomendado; considerar split o compresión.

## Bugs conocidos
- Ver `recent_fixes.md` (arreglados).
