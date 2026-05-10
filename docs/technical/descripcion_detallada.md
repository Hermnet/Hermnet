# Descripción Técnica Detallada

Hermnet es una aplicación móvil de mensajería privada basada en tres ideas:

1. La identidad se genera en el dispositivo.
2. Los mensajes se cifran extremo a extremo antes de salir del móvil.
3. El backend solo actúa como buzón temporal de payloads opacos.

## 1. Identidad

Cada usuario genera localmente un par de claves RSA-2048 mediante `react-native-quick-crypto`.

- La clave privada nunca se envía al servidor.
- La clave pública se registra para verificar autenticación y permitir que otros usuarios cifren mensajes.
- El HNET-id se calcula como `HNET-` + los primeros 16 caracteres hexadecimales en mayúsculas de `SHA-256(publicKey)`.

El servidor no almacena teléfono, email ni contraseña.

## 2. Autenticación

Hermnet usa un protocolo challenge-response:

1. El cliente pide un reto con `POST /api/auth/challenge`.
2. El backend genera un `nonce` temporal y lo guarda en `auth_challenges`.
3. El cliente firma el `nonce` con su clave privada RSA.
4. El backend verifica la firma con la clave pública registrada.
5. Si es válida, emite un JWT HS256 con un `jti` único.

Los endpoints `refresh` y `logout` revocan el `jti` en `token_blacklist`.

## 3. Mensajería

El mensaje no se envía en claro. El cliente construye un sobre JSON con metadatos mínimos:

```json
{
  "from": "HNET-...",
  "pk": "-----BEGIN PUBLIC KEY-----...",
  "text": "mensaje",
  "ts": 1778410000000,
  "seq": 42,
  "sig": "..."
}
```

Ese sobre se cifra con el protocolo híbrido:

- AES-256-GCM cifra el sobre.
- RSA-OAEP-SHA256 cifra la clave AES efímera.
- El resultado se envía como `payload` binario codificado en base64.

El backend lo guarda en `mailbox.payload` y no intenta leerlo, parsearlo ni modificarlo.

## 4. Recepción y ACK

El receptor consulta:

```http
GET /api/messages?myId=HNET-...
```

La app descifra localmente cada payload, valida que el HNET-id coincide con la clave pública recibida y guarda el mensaje en SQLite.

Después confirma la recepción con:

```http
POST /api/messages/ack
```

El ACK puede incluir un `cutoff` para borrar solo lo que el cliente ya procesó, evitando perder mensajes que entren durante la sincronización.

## 5. Persistencia

### Backend

PostgreSQL guarda solo datos mínimos:

- `users`: HNET-id, clave pública y push token opcional.
- `auth_challenges`: nonces temporales.
- `mailbox`: payloads cifrados pendientes.
- `token_blacklist`: JWT revocados.
- `rate_limit_buckets`: contadores por IP anonimizada.

### Frontend

SQLite local guarda:

- contactos;
- historial de mensajes;
- cola offline;
- preferencias de chat;
- propuestas temporales y control anti-replay.

SecureStore guarda identidad, JWT, PIN hash y preferencias sensibles.

## 6. Privacidad y Seguridad Operativa

- IPs anonimizadas con HMAC-SHA256 y sal rotativa en memoria.
- Rate limiting por cliente anonimizado.
- JWT de vida corta con blacklist por `jti`.
- Push notifications ciegas opcionales con Firebase.
- Limpieza periódica de datos efímeros mediante `DataRetentionScheduler`.
- Mensajes locales camuflados visualmente al reabrir chats antiguos.

## 7. Calidad

El backend usa JaCoCo con umbral obligatorio de cobertura de líneas del 98% en `mvn verify`.

El frontend se valida con TypeScript estricto y Jest.

## 8. Fuera de Alcance

No forman parte de la implementación actual:

- esteganografía en imágenes PNG;
- deep links de invitación;
- sincronización de escritorio;
- silent refresh proactivo antes de expiración.
