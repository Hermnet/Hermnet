# Backend — API y estructura

## Paquetes (`backend/src/main/java/com/hermnet/api/`)
- `controller/` — `AuthController`, `MessageController`
- `service/` — `AuthService`, `UserService`, `NotificationService`, `TokenBlacklistService`, `DataRetentionScheduler`
- `repository/` — Spring Data JPA repos (one per model)
- `model/` — `User`, `AuthChallenge`, `Message`, `BlacklistedToken`, `RateLimitBucket`
- `dto/` — DTOs con validación Jakarta (`@NotBlank`, `@Pattern`)
- `security/` — `JwtTokenProvider`, `JwtAuthenticationFilter`
- `config/` — `SecurityConfig`, `FirebaseConfig`, `IpAnonymizationFilter`, `RateLimitFilter`, `IpHasher`

## Endpoints
| Método | Ruta | Auth | Propósito |
|---|---|---|---|
| POST | `/api/auth/register` | No | Registra `id` (HNET-xxxxx) + `publicKey`, push token opcional |
| POST | `/api/auth/challenge` | No | Devuelve `nonce` para firmar |
| POST | `/api/auth/login` | No | Verifica firma Ed25519 → JWT |
| POST | `/api/auth/refresh` | Bearer | Revoca token actual (jti) y devuelve uno nuevo |
| POST | `/api/auth/logout` | Bearer | Revoca token actual (idempotente) |
| POST | `/api/messages` | JWT | Envía un payload cifrado al buzón del receptor |
| GET  | `/api/messages?myId=...` | JWT | Lista los payloads cifrados del receptor (byte[] list) |
| POST | `/api/messages/ack` | JWT | Borra los mensajes del usuario autenticado (opcional `cutoff` ISO-8601) |

## Seguridad
- **`/api/auth/**`** `permitAll`, resto autenticado (ver `SecurityConfig.java`).
- **Sesión stateless**, CSRF off.
- **Rate limit**: 60 req/ventana (60 s) por `ip_hash`.
- **IP anonimizada** (SHA-256 diario) antes de llegar a la lógica.
- **JWT HS256**, duración 15 min, claim `jti` por token. Secret ≥ 256 bits obligatorio (fail-fast en arranque).
- **Blacklist de jti** (`token_blacklist`): consultada en cada request por `JwtAuthenticationFilter`. `refresh`/`logout` revocan; el scheduler limpia entradas expiradas.

## Configuración JWT
- `jwt.secret` (env `JWT_SECRET`, fallback dev de 64 chars). Producción **debe** definir `JWT_SECRET`.
- `jwt.expiration.minutes` (env `JWT_EXPIRATION_MINUTES`, default 15). El refresh emite un token nuevo con la misma duración.

## Formato de ID
Regex `^HNET-[A-Za-z0-9]{5,}$` (validado en `RegisterRequest`).

## Persistencia
Schema en `docs/technical/esquema_base_datos.md`. Tablas: `users`, `auth_challenges`, `mailbox` (entidad `Message`), `blacklisted_tokens`, `rate_limit_buckets`.

## Tareas programadas
`DataRetentionScheduler` → cron `app.privacy.data-retention.cleanup-cron` limpia buzones, challenges expirados, blacklist.
