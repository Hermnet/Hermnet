## Arquitectura Backend y Definición de API

<div style="text-align: justify; text-indent: 20px;">


## 1. Función y Responsabilidad del Servidor

El servidor de Hermnet implementa una arquitectura de **"Dumb Relay" (Relé Pasivo)**. Su función se limita estrictamente al transporte y almacenamiento temporal de blobs de datos cifrados, desacoplando la lógica de seguridad y negocio, que reside en el cliente (Thick Client).

El backend no procesa, no indexa y no analiza el contenido de los mensajes. Actúa como un búfer de sincronización asíncrona entre pares.

### A. Autenticación (Protocolo Challenge-Response)
*   **POST /api/v1/auth/challenge**
    *   **Input:** `{ "id_hash": "HNET-7a..." }`
    *   **Lógica:** Genera un nonce aleatorio, lo guarda en `auth_challenges` y lo devuelve.
    *   **Output:** `{ "nonce": "a1b2...", "expires_in": 30 }`
*   **POST /api/v1/auth/verify**
    *   **Input:** `{ "id_hash": "...", "signature": "..." }`
    *   **Lógica:** Verifica la firma Ed25519 con la `public_key`. Si es válida, emite JWT.
    *   **Output:** `{ "token": "eyJhbGci...", "refresh_token": "..." }`

### B. Gestión de Identidad
*   **POST /api/v1/users/register**
    *   **Input:** `{ "id_hash": "...", "public_key": "..." }`
    *   **Lógica:** Registra al usuario en el directorio público users.
*   **PUT /api/v1/users/push-token**
    *   **Header:** `Authorization: Bearer <JWT>`
    *   **Input:** `{ "push_token": "fcm_token_..." }`
    *   **Lógica:** Asocia el token de notificación al hash del usuario para las alertas ciegas.

### C. Transporte de Mensajes (Mailbox)
*   **POST /api/v1/messages/send**
    *   **Header:** `Authorization: Bearer <JWT>`
    *   **Type:** Multipart/Form-Data
    *   **Input:** file (Imagen PNG 1.5MB), `recipient_hash`.
    *   **Lógica:**
        1.  Verifica tamaño exacto (1.5MB).
        2.  Guarda el BLOB en `mailbox`.
        3.  Dispara "Blind Push" al destinatario.
    *   **Output:** 200 OK.
*   **GET /api/v1/messages/sync**
    *   **Header:** `Authorization: Bearer <JWT>`
    *   **Lógica:** Busca en mailbox mensajes donde `recipient_hash == user.id`.
    *   **Output:** Array de imágenes PNG.
*   **POST /api/v1/messages/ack**
    *   **Input:** `{ "message_ids": [101, 102] }`
    *   **Lógica:** Borrado físico inmediato de los mensajes entregados.

## 2. Seguridad de Red y Anonimato (Puntos 10 y 12)

### A. El Escudo Ciego (IP Anonymization) [Punto 10]
El servidor nunca debe conocer la IP real del usuario de forma persistente.
*   **Filtro de Aplicación:** Antes de llegar al Controlador, un Filter intercepta la petición.
*   **Hashing Diario:**
    *   Calculamos:
    *   $$Hash = \text{SHA-256}(\text{IP Real} + \text{Salt del Día})$$
    *   El "Salt" se rota cada 24 horas automáticamente.
*   **Uso:** Este hash solo se usa para el Rate Limiting (evitar ataques DDoS) durante el día. Al día siguiente, es imposible vincular la actividad pasada con la IP.
*   **Zero-Log Policy:** Configuración de Logback para excluir `%ip` y `X-Forwarded-For`.

### B. Gestión de Tokens (JTI y Blacklist) [Punto 12]
Para mitigar el robo de sesiones:
*   **JTI Único:** Cada JWT emitido lleva un ID único (uuid).
*   **Middleware de Validación:** En cada request, el servidor comprueba si el `jti` está en la tabla `token_blacklist`.
*   **Si está en la lista negra** $\rightarrow$ 401 Unauthorized (aunque la fecha de expiración sea válida).
*   **Rotación Silenciosa (Silent Refresh):**
    *   Los tokens duran muy poco (ej. 5 min).
    *   Cuando falta 1 minuto, la app pide uno nuevo automáticamente.
    *   El servidor invalida el anterior (lo mete en la Blacklist) y entrega el nuevo.

## 3. Notificaciones Push Ciegas (Blind Push) [Punto 13]
El reto es avisar sin revelar nada a Google/Apple.

*   **Trigger:** El servidor recibe un POST en `/messages/send`.
*   **Payload Vacío:** Construye una notificación que NO contiene texto, ni nombre del emisor, ni preview de la imagen.
*   **JSON enviado a FCM/APNs:** `{ "action": "sync_new_msg" }`.
*   **Efecto en el Móvil:**
    *   La notificación no muestra nada en pantalla.
    *   Despierta a la app en segundo plano (Background Task).
    *   La app descarga la imagen, extrae el mensaje y lo descifra localmente.
    *   Solo entonces la app lanza una notificación local: "Tienes un nuevo mensaje cifrado".

## 4. Política de Privacidad Técnica (Data Sanitization)

El servidor implementa medidas activas para minimizar la huella de datos:
*   **Limpieza de Metadatos (EXIF Stripping):** Procesamiento automático de imágenes entrantes para eliminar metadatos técnicos (geoetiquetas, make/model, timestamps) antes del almacenamiento.
*   **Integridad de Byte:** Garantía de inmutabilidad del payload de imagen para preservar la información esteganográfica (Bit-exact storage).

</div>
