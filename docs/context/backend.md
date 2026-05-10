# Backend

## Paquetes

- `controller`: `AuthController`, `MessageController`.
- `service`: auth, users, notifications, token blacklist, retention.
- `repository`: Spring Data JPA.
- `model`: entidades JPA.
- `dto`: requests/responses.
- `security`: JWT provider/filter.
- `config`: CORS, Firebase, filtros, migraciones.

## Endpoints

| Método | Ruta | Auth |
|---|---|---|
| POST | `/api/auth/register` | No |
| POST | `/api/auth/challenge` | No |
| POST | `/api/auth/login` | No |
| POST | `/api/auth/refresh` | Bearer |
| POST | `/api/auth/logout` | Bearer |
| POST | `/api/messages` | JWT |
| GET | `/api/messages?myId=...` | JWT |
| POST | `/api/messages/ack` | JWT |

## Seguridad

- JWT HS256 con secret >= 32 bytes.
- `jti` por token y blacklist.
- IP anonimizada.
- Rate limit por bucket.
- CORS configurable.
- Sesión stateless.

## Persistencia

Tablas: `users`, `auth_challenges`, `mailbox`, `token_blacklist`, `rate_limit_buckets`.

Más detalle: `docs/technical/esquema_base_datos.md`.

## Calidad

`mvn verify` ejecuta tests y cobertura. Umbral mínimo: 98% líneas.
