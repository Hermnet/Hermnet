# Flujo de mensajería

Orquestado en `MessageFlowService` (frontend). Servidor es opaco: `byte[]` in / `byte[]` out.

## Envío
1. Usuario escribe mensaje en `ChatRoomScreen`.
2. `MessageCryptoService` genera clave efímera AES-256-GCM y cifra el texto.
3. Cifra la clave efímera con la `publicKey` del receptor (ECDH X25519 → KDF).
4. Construye payload: `{cipherText, encryptedKey, nonce, senderId, ...}`.
5. `SteganographyService.embedInPng()` inserta el "churro binario" en los LSB de un PNG cover:
   - Cabecera 4B tamaño | payload | delimitador | padding ruido aleatorio → total ~1.5 MB.
6. `MessageApiService.send()` → `POST /api/messages` con `{recipientId, stegoImage}`.
7. Backend guarda en `mailbox` y dispara push FCM vacío (`NotificationService.sendSyncNotification`).

## Recepción
1. Push silencioso despierta la app → `MessageFlowService.sync()`.
2. `GET /api/messages?myId=...` → lista de PNG (byte[] Base64).
3. Para cada imagen: `SteganographyService.extractFromPng()` lee LSB hasta el delimitador.
4. `MessageCryptoService.decrypt()` con la privateKey local.
5. Se guarda en `messages_history` (SQLite local cifrada).
6. (Pendiente verificar) `POST /api/messages/ack` para borrado inmediato — hoy el backend no tiene este endpoint, borra por scheduler.

## Notas
- Backend no valida el contenido del PNG, solo persiste y reenvía.
- Capacidad ~375 KB por PNG 1024×1024.
- Algoritmo detallado: `docs/technical/algoritmo_esteganografia.md`, `cifrado_hibrido_e2ee.md`.
