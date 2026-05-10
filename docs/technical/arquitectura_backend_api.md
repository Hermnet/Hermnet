# Arquitectura Backend y API

El backend de Hermnet es un servidor ciego. Su responsabilidad es autenticar usuarios, transportar payloads cifrados y limpiar datos temporales. No conoce el contenido de los mensajes.

## 1. Componentes

| Paquete | Responsabilidad |
|---|---|
| `controller` | Expone endpoints REST |
| `service` | Lógica de autenticación, usuarios, notificaciones, retención y revocación |
| `repository` | Acceso a datos con Spring Data JPA |
| `model` | Entidades JPA |
| `dto` | Contratos de entrada/salida con validación |
| `security` | JWT y filtro de autenticación |
| `config` | CORS, filtros, Firebase, migraciones y anonimización IP |

## 2. Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Registra HNET-id, clave pública y push token opcional |
| `POST` | `/api/auth/challenge` | No | Genera nonce temporal para login |
| `POST` | `/api/auth/login` | No | Verifica firma RSA y devuelve JWT |
| `POST` | `/api/auth/refresh` | Bearer | Revoca token actual y emite uno nuevo |
| `POST` | `/api/auth/logout` | Bearer | Revoca token actual |
| `POST` | `/api/messages` | JWT | Guarda un payload cifrado para el receptor |
| `GET` | `/api/messages?myId=...` | JWT | Devuelve payloads cifrados pendientes |
| `POST` | `/api/messages/ack` | JWT | Borra mensajes ya procesados por el receptor |

## 3. Seguridad

- Sesiones stateless.
- CSRF desactivado para API REST.
- `/api/auth/**` público; `/api/messages/**` autenticado.
- JWT HS256 con `jti`.
- Blacklist de tokens revocados.
- Rate limit por cliente anonimizado.
- IP anonimizada antes de aplicar rate limit.
- CORS configurable por `CORS_ALLOWED_ORIGINS`.

## 4. Mensajes

El servidor recibe:

```json
{
  "recipientId": "HNET-...",
  "payload": "base64..."
}
```

Guarda el payload como `bytea` en `mailbox`. El payload es opaco: no se parsea, no se descifra y no se indexa por contenido.

Al leer, el servidor devuelve `MailboxMessageResponse` con:

- `payload`;
- `createdAt`.

El cliente usa `createdAt` como cutoff de ACK para evitar borrar mensajes que llegaron durante una sincronización.

## 5. Firebase

Firebase Admin SDK es opcional en desarrollo.

Si no hay credenciales:

- el backend arranca;
- `NotificationService` omite el envío de push;
- la mensajería sigue funcionando por polling.

Si hay credenciales, el backend envía una push data-only con:

```json
{ "action": "SYNC_REQUIRED" }
```

## 6. Retención de Datos

`DataRetentionScheduler` limpia periódicamente:

- mensajes antiguos en `mailbox`;
- challenges expirados;
- tokens revocados ya expirados.

La app confirma entrega con `/api/messages/ack`, por lo que el servidor no se convierte en historial permanente.

## 7. Calidad

`mvn verify` ejecuta tests y JaCoCo. El build falla si la cobertura de líneas del backend baja del 98%.
