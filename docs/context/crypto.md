# Criptografía

## Primitivas
- **Ed25519** — firma de identidad (login challenge-response).
- **X25519** — ECDH para derivar clave compartida entre emisor/receptor.
- **AES-256-GCM** — cifrado simétrico del payload de mensaje.
- **SHA-256** — hash de PIN, IPs, IDs.
- **PBKDF2** (docs) — derivación de clave desde PIN para desbloquear SK local.

## Librerías
- **Frontend**: `react-native-quick-crypto` (hash, AES), `tweetnacl` (curva 25519).
- **Backend**: JDK `java.security`, `jjwt` para JWT HS256.

## Claves importantes
- `jwt.secret` en `backend/src/main/resources/application.properties` — **mínimo 32 bytes** (256 bits) o `WeakKeyException`.
- Claves privadas de usuario NUNCA salen del dispositivo, viven en SecureStore.
- Huella de seguridad de un contacto = primeros 4 + últimos 4 chars del hash de su publicKey (ver TOFU).

## Intercambio inicial (TOFU)
QR / deep link `hermnet://invite?data=BASE64(JSON)` con `{h, pk, n}`. Ver `docs/technical/intercambio_claves_p2p.md`.

## Reglas
- Nunca loguear claves privadas, JWT completos o nonces fuera de `__DEV__`.
- Nonces de login se borran tras uso (`delete from auth_challenges`).
