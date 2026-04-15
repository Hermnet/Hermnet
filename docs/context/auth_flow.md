# Flujo de autenticación

Implementado en `AuthFlowService.bootstrapLogin()` (frontend) + `AuthController`/`AuthService` (backend).

## Primer arranque (nueva identidad)
1. `IdentityService.generateIdentity()` → `{id: "HNET-xxxxx", publicKey, privateKey}` (Ed25519).
2. `POST /api/auth/register` con `{id, publicKey, pushToken?}`.
3. `AuthSessionService.setIdentity()` guarda el par en SecureStore.
4. Continúa al paso challenge/login.

## Login (cada arranque)
1. `POST /api/auth/challenge` con `{userId}` → `{nonce}` (TTL 30 s en docs; ver `AuthService`).
2. Firma local: `IdentityService.signNonce(privateKey, nonce)` (Ed25519).
3. `POST /api/auth/login` con `{nonce, signedNonce}`.
4. Backend verifica firma con publicKey almacenada → devuelve `{token}` JWT.
5. Frontend guarda JWT en SecureStore y lo mete en memoria del authStore.
6. `ApiClient` incluye `Authorization: Bearer ...` en todas las requests posteriores.

## Renovación / 401
- `configureUnauthorizedHandler` (en `app/_layout.tsx`) ejecuta `bootstrapLogin` de nuevo al recibir 401.

## PIN local
- `HomeScreen.handlePinComplete` lanza `bootstrapLogin` en paralelo a la animación de carga.
- `handleLoadingFinish` espera la promesa, guarda `hash(pin + identity.id)` en SecureStore.
- `handleLoginComplete` (cuando `hasAccount`): si el login remoto falla pero hay cache válido + PIN correcto → entra offline.

Más detalle crypto: `docs/technical/protocolo_autenticacion.md`.
