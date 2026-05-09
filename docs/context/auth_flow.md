# Flujo de autenticación

Implementado en `AuthFlowService.bootstrapLogin()` (frontend) + `AuthController`/`AuthService` (backend).

## Primer arranque (nueva identidad)
1. `IdentityService.generateIdentity()` → `{id: "HNET-xxxxx", publicKey, privateKey}` (**RSA-2048** vía `react-native-quick-crypto`).
2. `POST /api/auth/register` con `{id, publicKey, pushToken?}`.
3. `AuthSessionService.setIdentity()` guarda el trío en SecureStore (3 keys separadas: `identity_id`, `identity_publicKey`, `identity_privateKey`).
4. Continúa al paso challenge/login.

## Login (cada arranque)
1. `POST /api/auth/challenge` con `{userId}` → `{nonce}` (TTL en `AuthService`, nonce aleatorio).
2. Firma local: `IdentityService.signNonce(privateKey, nonce)` — firma **SHA256withRSA** con la clave privada RSA-2048.
3. `POST /api/auth/login` con `{nonce, signedNonce}`.
4. Backend verifica firma RSA con la publicKey almacenada (`Signature.getInstance("SHA256withRSA")`) → devuelve `{token}` JWT HS256.
5. Frontend guarda JWT en SecureStore y lo mete en memoria del authStore.
6. `ApiClient` incluye `Authorization: Bearer ...` en todas las requests posteriores.

## Renovación / 401
- `configureUnauthorizedHandler` (en `app/_layout.tsx`) ejecuta `bootstrapLogin` de nuevo al recibir 401.
- `POST /api/auth/refresh` (Bearer) revoca el token actual (jti → blacklist) y devuelve uno nuevo.

> **⚠️ No implementado:** Silent refresh automático en el cliente (renovación proactiva antes de expiración). Actualmente solo se renueva de forma reactiva al recibir 401.

## JWT
- Algoritmo: HS256.
- Duración: **15 minutos** (configurable vía `JWT_EXPIRATION_MINUTES`, default 15).
- Cada token lleva un `jti` único (UUID).
- Blacklist de jti en tabla `blacklisted_tokens`, consultada en cada request.

## PIN local
- `HomeScreen.handlePinComplete` lanza `bootstrapLogin` en paralelo a la animación de carga.
- `handleLoadingFinish` espera la promesa, guarda `hash(pin + identity.id)` en SecureStore vía `PrefsService`.
- `handleLoginComplete` (cuando `hasAccount`): si el login remoto falla pero hay cache válido + PIN correcto → entra offline.
- PIN de 6 dígitos, pantalla de creación con flujo de 2 pasos (crear + confirmar) con indicadores visuales.

> **Nota:** La clave privada se almacena directamente en SecureStore (cifrado del SO), NO se aplica KDF/AES adicional con el PIN como describía la documentación técnica original. El PIN se usa para desbloquear la interfaz de la app y como factor de verificación local.

Más detalle crypto: `docs/technical/protocolo_autenticacion.md`.
