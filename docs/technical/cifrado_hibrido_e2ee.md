## Especificación del Cifrado Híbrido (AES + RSA)

<div style="text-align: justify; text-indent: 20px;">

## 1. Arquitectura de Seguridad de Datos

Este módulo define el protocolo de cifrado de extremo a extremo (E2EE) aplicado a los payloads de los mensajes. Su objetivo es garantizar **confidencialidad, integridad y autenticidad** de los datos antes de salir del dispositivo del emisor. El servidor jamás participa en la operación criptográfica: recibe un blob binario opaco y lo reenvía.

El sistema implementa un **cifrado híbrido** estandarizado que aprovecha lo mejor de cada familia:

* **Capa simétrica (Bulk Encryption)**: AES-256-GCM cifra el contenido del mensaje. Es rápido, eficiente con cualquier tamaño y autentica la integridad gracias al modo GCM.
* **Capa asimétrica (Key Encapsulation)**: RSA-OAEP-SHA256 cifra **únicamente la clave AES efímera** usando la clave pública del receptor. Esto evita el límite de tamaño de RSA (≈190 B con OAEP-SHA256 y módulo de 2048 bits) y mantiene la simplicidad criptográfica.

## 2. Stack Tecnológico

| Función | Algoritmo | Librería | Justificación |
| :--- | :--- | :--- | :--- |
| **Cifrado del mensaje** | AES-256-GCM | `react-native-quick-crypto` | Estándar industrial. GCM aporta integridad mediante un tag de 128 bits. |
| **Encapsulado de clave** | RSA-OAEP-SHA256 (RSA-2048) | `react-native-quick-crypto` | Mismo par de claves que se usa para identidad. OAEP protege contra ataques de padding. |
| **Aleatoriedad** | CSPRNG (`randomBytes`) | `react-native-quick-crypto` | Generador criptográficamente seguro para clave AES e IV. |

## 3. Lógica del Algoritmo (Paso a Paso)

### Fase A — El emisor (cerrar la cápsula)

El usuario escribe `"Hola Mundo"`. La función `MessageCryptoService.encryptForRecipient(plaintext, recipientPubKey)` ejecuta:

1. **Generación de clave efímera ($K_S$)**:
   * `randomBytes(32)` → clave AES de 256 bits, válida solo para este mensaje.
2. **IV aleatorio**:
   * `randomBytes(12)` → vector de inicialización único (12 B es el tamaño recomendado para AES-GCM).
3. **Cifrado del contenido (AES)**:
   * `createCipheriv('aes-256-gcm', K_S, IV)` cifra el sobre JSON `{from, pk, text, ts}`.
   * Resultado: `ciphertext` + `authTag` (16 B).
4. **Encapsulado de la clave (RSA)**:
   * `publicEncrypt({ key: pubKey, padding: RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, K_S)`.
   * Resultado: `encryptedKey` (256 B con módulo de 2048 bits).
5. **Empaquetado**:
   * Se concatena en un único `Uint8Array`:
     ```
     [ 2B longitud_RSA | encryptedKey | 12B IV | 16B authTag | ciphertext ]
     ```
   * Total ≈ 800 B para un mensaje típico (la `pk` del emisor incluida en el sobre representa ~450 B base64).

Este paquete se envía tal cual (codificado en base64) al backend mediante `POST /api/messages` con `{recipientId, payload}`.

### Fase B — El receptor (abrir la cápsula)

`MessageCryptoService.decryptWithPrivateKey(packet, privKey)` ejecuta el camino inverso:

1. **Desempaquetado**:
   * Lee los 2 primeros bytes para conocer la longitud `N` del bloque RSA.
   * Separa `encryptedKey` (N bytes), `IV` (12 B), `authTag` (16 B) y `ciphertext` (resto).
2. **Recuperación de la clave efímera**:
   * `privateDecrypt({ key: privKey, padding: RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, encryptedKey)` → `K_S`.
3. **Descifrado del contenido (AES-GCM)**:
   * `createDecipheriv('aes-256-gcm', K_S, IV)` y `setAuthTag(authTag)`.
   * Si el tag verifica: devuelve el sobre JSON original.
   * Si no verifica: lanza `Error: Unsupported state or unable to authenticate data` y la app descarta el paquete.
4. **Limpieza**:
   * `K_S` queda fuera de scope y es recolectado por el garbage collector.

## 4. Control de Errores y Edge Cases

### Escenario 1 — Paquete manipulado (Man-in-the-Middle)
* **Situación**: un atacante intercepta el blob y cambia algunos bits del ciphertext o del tag.
* **Reacción**: AES-GCM detecta la incoherencia entre `ciphertext` y `authTag` y rechaza el descifrado.
* **Acción**: `MessageFlowService.syncInbox` captura la excepción, registra `console.warn('[syncInbox] paquete inválido descartado')` y continúa con los demás paquetes. El servidor recibirá luego el `ack` y borrará el blob inválido.

### Escenario 2 — Clave privada incorrecta o reinstalación
* **Situación**: el receptor reinstaló la app y generó un nuevo par de claves; un mensaje viejo le llega cifrado con la clave pública antigua.
* **Reacción**: `privateDecrypt` lanza por padding incorrecto.
* **Acción**: el paquete se descarta como en el caso anterior. La identidad anterior es inalcanzable; el usuario debería intercambiar QR de nuevo con sus contactos.

### Escenario 3 — Reutilización de IV (sin riesgo en este diseño)
* Como cada mensaje genera una clave AES nueva (`K_S`), el par `(K_S, IV)` jamás se reutiliza incluso si dos mensajes consecutivos compartiesen el IV. La separación de claves elimina la mayor superficie de ataque del modo GCM.

### Escenario 4 — Sobre malformado tras descifrado
* **Situación**: el descifrado tiene éxito (tag válido) pero el JSON del sobre no parsea o no contiene `from`.
* **Reacción**: el flujo descarta el paquete con `console.warn('[syncInbox] payload sin envoltorio descartado')` y no lo guarda en `messages_history` (para no dejar mensajes huérfanos sin remitente).

### Escenario 5 — Suplantación de identidad (anti-spoofing)
* **Situación**: un atacante envía un sobre con `from = HNET-VICTIMA` pero con su propia `pk` para que el receptor lo guarde como "víctima".
* **Reacción**: `MessageFlowService.syncInbox` recalcula `SHA-256(pk)[0:16]` y verifica que coincide con `from`. Si no, descarta el paquete.

## 5. Resumen del flujo de datos

**Input**:
* Sobre JSON `{from, pk, text, ts}` (string).
* Clave pública RSA-2048 del destinatario en formato PEM SPKI.

**Process**:
1. `K_S = randomBytes(32)`
2. `IV  = randomBytes(12)`
3. `(ciphertext, authTag) = AES_256_GCM_Encrypt(envelope, K_S, IV)`
4. `encryptedKey = RSA_OAEP_SHA256_Encrypt(K_S, recipientPubKey)`
5. `packet = lengthHeader || encryptedKey || IV || authTag || ciphertext`

**Output**:
* `Uint8Array` listo para enviar al backend (se codifica en base64 dentro del JSON `{recipientId, payload}`).

</div>
