# Criptografía

## Primitivas
- **RSA-2048** — par de claves de identidad (firma challenge-response + encapsulado de clave AES).
- **RSA-OAEP-SHA256** — cifrado asimétrico de la clave AES efímera en el esquema híbrido E2EE.
- **AES-256-GCM** — cifrado simétrico del payload de mensaje (clave efímera de 32 bytes, IV de 12 bytes, tag de 16 bytes).
- **SHA-256** — hash de PIN, IPs, generación de HNET-id a partir de la clave pública.
- **PBKDF2** — derivación de clave desde contraseña para cifrar archivos de respaldo `.hnet`.

## Librerías
- **Frontend**: `react-native-quick-crypto` (RSA keygen, RSA-OAEP, AES-GCM, SHA-256, PBKDF2, firma/verificación).
- **Backend**: JDK `java.security` (verificación de firma RSA con `Signature.getInstance("SHA256withRSA")`), `jjwt` para JWT HS256.

> **Nota:** La documentación técnica original mencionaba Ed25519/X25519/tweetnacl. La implementación real usa **RSA-2048** con `react-native-quick-crypto`. `tweetnacl` **no se utiliza** en el proyecto.

## Claves importantes
- `jwt.secret` configurado vía env `JWT_SECRET` en `application.properties` — **mínimo 32 bytes** (256 bits) o el backend falla al arrancar (`WeakKeyException`).
- Claves privadas de usuario NUNCA salen del dispositivo, se almacenan en `expo-secure-store` (3 keys separadas: `identity_id`, `identity_publicKey`, `identity_privateKey`).
- Huella de seguridad de un contacto = primeros 4 + últimos 4 chars del hash SHA-256 de su publicKey (ver TOFU).
- La PEM RSA-2048 de la clave privada ocupa ~1700 bytes, dentro del límite recomendado de SecureStore.

## Esquema híbrido E2EE
1. Generar clave AES efímera de 32 bytes + IV de 12 bytes.
2. Cifrar el mensaje JSON con AES-256-GCM → ciphertext + authTag (16 bytes).
3. Cifrar la clave AES con RSA-OAEP-SHA256 usando la publicKey del receptor.
4. Concatenar: `[2B longitud RSA][RSA(AES-key)][12B IV][16B tag][ciphertext]`.
5. Codificar en base64 para transporte HTTP.

Detalle completo: `docs/technical/cifrado_hibrido_e2ee.md`.

## Intercambio inicial (TOFU)
QR presencial con JSON `{h, pk, n}`:
- `h`: HNET-id del usuario.
- `pk`: clave pública RSA-2048 (PEM).
- `n`: alias local.

Ver `docs/technical/intercambio_claves_p2p.md`.

## Archivo de respaldo (.hnet)
- `RecoveryService.ts` empaqueta identidad + contactos + mensajes en JSON.
- Cifra con AES-256-GCM usando clave derivada con PBKDF2 desde contraseña del usuario.
- Resultado: archivo `.hnet` que el usuario guarda externamente.
- Para restaurar: seleccionar archivo + introducir contraseña → descifra → restaura identidad y datos.

## Reglas
- Nunca loguear claves privadas, JWT completos o nonces fuera de `__DEV__`.
- Nonces de login se borran tras uso (`delete from auth_challenges`).
- Los payloads cifrados son opacos para el servidor — no inspecciona ni decodifica.
