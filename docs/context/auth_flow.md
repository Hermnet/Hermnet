# Flujo de Autenticación

## Primer Arranque

1. `IdentityService.generateIdentity()` genera RSA-2048.
2. HNET-id = fingerprint SHA-256 de la publicKey.
3. `POST /api/auth/register`.
4. `AuthSessionService` guarda identidad en SecureStore.
5. Se configura PIN local.

## Login

1. `POST /api/auth/challenge` con `{userId}`.
2. El backend devuelve `nonce`.
3. El cliente firma con privateKey (`SHA256withRSA`).
4. `POST /api/auth/login` con nonce y firma.
5. Backend verifica con publicKey y emite JWT.
6. `ApiClient` añade Bearer token por interceptor.

## Refresh / Logout

- `refresh`: valida token, comprueba blacklist, revoca `jti` actual y emite nuevo JWT.
- `logout`: revoca `jti` actual.

## Offline Local

Si el backend no encuentra el usuario pero la identidad local existe, el cliente puede re-registrar la identidad cacheada. El PIN permite mantener sesión local cuando hay fallo remoto puntual.

## No Implementado

Silent refresh proactivo antes de expiración. La renovación es reactiva al recibir 401/403.
