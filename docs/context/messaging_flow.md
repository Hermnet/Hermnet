# Flujo de mensajería

Orquestado en `MessageFlowService` (frontend). Servidor opaco: `byte[]` in / `byte[]` out.

## Envío
1. Usuario escribe mensaje en `ChatRoomScreen`.
2. `MessageFlowService.sendMessage()` construye un sobre JSON: `{from, pk, text, ts}`.
3. `MessageCryptoService.encryptForRecipient()` aplica cifrado híbrido:
   - Genera clave AES-256 efímera + IV.
   - Cifra el sobre con AES-256-GCM (incluye tag de autenticación de 16 B).
   - Cifra la clave AES (32 B) con RSA-OAEP-SHA256 usando la `publicKey` del receptor.
   - Empaqueta `[2B longitud RSA][RSA(AES-key)][12B IV][16B tag][ciphertext]`.
4. `MessageApiService.sendMessage()` → `POST /api/messages` con `{recipientId, payload}` (payload base64).
5. Backend guarda en `mailbox.payload` y dispara push silenciosa FCM (`NotificationService.sendSyncNotification`).
6. El emisor guarda el mensaje en su SQLite local con `created_at = ts` (mismo timestamp que el receptor).

## Recepción
1. Polling cada 2 s (o push silenciosa) → `MessageFlowService.syncInbox()`.
2. `GET /api/messages?myId=...` → lista de payloads (base64 → `Uint8Array`).
3. `MessageCryptoService.decryptWithPrivateKey()` con la clave privada local: descifra la clave AES con RSA y luego el ciphertext con AES-GCM (verifica tag).
4. Parsea el sobre JSON. Si trae `pk`, verifica que el `HNET-id` corresponda al fingerprint SHA-256 de esa pk (anti-spoofing). Si no cuadra, descarta.
5. Auto-añade el contacto si era desconocido y notifica a la UI vía la cola `newContacts`.
6. Guarda en `messages_history` con `created_at = envelope.ts`.
7. `POST /api/messages/ack` para que el servidor borre el buzón consumido.

## Notas
- Cada paquete enviado pesa ~800 B (la pk del emisor inflada por base64), constante para todos los mensajes y handshakes.
- El servidor nunca decodifica el `payload` — para él es un blob opaco.
- Detalle criptográfico: `docs/technical/cifrado_hibrido_e2ee.md`.
