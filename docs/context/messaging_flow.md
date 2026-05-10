# Flujo de Mensajería

## Envío

1. `ChatRoomScreen` llama a `MessageFlowService.sendMessage`.
2. Se construye sobre JSON con `from`, `pk`, `text`, `ts`, `seq` y firma si aplica.
3. `MessageCryptoService` cifra con AES-256-GCM + RSA-OAEP-SHA256.
4. `MessageApiService` llama `POST /api/messages`.
5. Se guarda copia local en SQLite.
6. Si falla por red, se encola en `sync_queue`.

## Recepción

1. Polling/push llama a `syncInbox`.
2. `GET /api/messages?myId=...`.
3. Se descifra cada payload localmente.
4. Se valida anti-spoofing: `from` debe coincidir con fingerprint de `pk`.
5. Se valida anti-replay con `seq`.
6. Se guarda en `messages_history`.
7. Se envía `POST /api/messages/ack` con cutoff.

## Orden

El historial local se ordena por `msg_id`, no por minuto/timestamp, para evitar que mensajes del mismo minuto cambien de posición.

## Camuflaje Visual

- Mensajes recibidos/enviados mientras el chat está abierto: visibles.
- Mensajes antiguos al reabrir: camuflados.
- Mensajes nuevos no leídos: visibles hasta ser leídos.

## Chat List

Muestra contador de no leídos y preview camuflada cuando el último mensaje ya debe estar oculto.
