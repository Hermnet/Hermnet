## Especificación del Cifrado Híbrido (AES + ECC)

<div style="text-align: justify; text-indent: 20px;">


## 1. Arquitectura de Seguridad de Datos

Este módulo define el protocolo de cifrado de extremo a extremo (E2EE) aplicado a los payloads de los mensajes. El objetivo es garantizar la confidencialidad, integridad y autenticidad de los datos antes de su ofuscación esteganográfica.

El sistema implementa un esquema de **Cifrado Híbrido** estandarizado que optimiza el rendimiento y la gestión de claves:
*   **Capa Simétrica (Bulk Encryption):** Utiliza AES-GCM para el cifrado eficiente del contenido del mensaje.
*   **Capa Asimétrica (Key Encapsulation):** Utiliza ECC (Curva Elíptica) para el intercambio seguro de la clave simétrica efímera (Session Key) entre emisor y receptor.

## 2. Stack Tecnológico

Bibliotecas criptográficas seleccionadas para React Native (Cliente) y Java (Servidor, si fuera necesario verificar, aunque aquí el cifrado es E2EE).

| Función | Algoritmo | Librería (RN) | Justificación |
| :--- | :--- | :--- | :--- |
| **Cifrado de Mensaje** | AES-256-GCM | `react-native-quick-crypto` | Estándar militar. El modo GCM incluye integridad (detecta si el mensaje fue alterado). |
| **Intercambio de Clave** | ECC (X25519) | `react-native-quick-crypto` | Curva elíptica moderna. Permite derivar una clave compartida segura usando la PK del destinatario. |
| **Aleatoriedad** | CSPRNG | `SecureRandom` | Generador de números aleatorios seguro para crear la clave efímera y el IV. |

## 3. Lógica del Algoritmo (Paso a Paso)

### Fase A: El Emisor (Cerrar la Cápsula)
El usuario escribe "Hola Mundo". El código hace lo siguiente:

1.  **Generación de Clave Efímera ($K_S$):**
    *   Creamos una clave aleatoria de 32 bytes (256 bits) en memoria. Esta clave servirá SOLO para este mensaje.
2.  **Cifrado del Contenido (AES):**
    *   Usamos $K_S$ para cifrar el texto o archivo.
    *   Generamos un IV (Vector de Inicialización) aleatorio de 12 bytes.
    *   Resultado: `Ciphertext` + `AuthTag` (sello de integridad).
3.  **Encapsulamiento de la Clave (KEM):**
    *   Ahora tenemos un problema: ¿Cómo le pasamos $K_S$ al destinatario?
    *   Usamos su Clave Pública (obtenida de `contacts_vault`).
    *   Calculamos un "secreto compartido" o ciframos directamente $K_S$ usando criptografía de curva elíptica.
    *   Resultado: `Encrypted_Key`.
4.  **Empaquetado (Payload):**
    *   Concatenamos todo en un solo array de bytes (Buffer):
    *   `[ Longitud_Clave (2b) | Clave_Cifrada | IV (12b) | AuthTag (16b) | Mensaje_Cifrado ]`

Este "Churro de Bytes" es lo que se envía al Motor de Esteganografía (Doc 04) para ser inyectado en la imagen.

### Fase B: El Receptor (Abrir la Cápsula)
El usuario recibe una imagen y extrae el "Churro de Bytes".

1.  **Desempaquetado:**
    *   El código lee los primeros bytes para saber dónde corta cada parte: separa la Clave_Cifrada, el IV, el Tag y el Mensaje.
2.  **Recuperación de la Clave Efímera ($K_S$):**
    *   Usa su propia Clave Privada (guardada en `key_store` y desbloqueada con PIN/Huella) para descifrar la Clave_Cifrada.
    *   Ahora tiene la $K_S$ original en memoria RAM.
3.  **Descifrado del Contenido (AES):**
    *   Usa $K_S$ + IV para descifrar el mensaje.
4.  **Verificación de Integridad:** El algoritmo GCM comprueba el `AuthTag`.
    *   **Si coincide:** Devuelve "Hola Mundo".
    *   **Si no coincide:** Lanza error "Mensaje corrupto o manipulado".
5.  **Limpieza:**
    *   Borra $K_S$ de la memoria inmediatamente.

## 4. Control de Errores y Edge Cases

Instrucciones para que el programador blinde el código ante ataques o fallos.

### Escenario 1: Mensaje Manipulado (Man-in-the-Middle)
*   **Situación:** Un atacante intercepta la imagen y cambia aleatoriamente unos píxeles (bits del mensaje cifrado) para ver qué pasa.
*   **Reacción:**
    *   Al intentar descifrar con AES-GCM, el AuthTag no coincidirá con los datos alterados.
*   **Acción:** La librería lanza una excepción `DecryptionError`. La app debe capturarla y mostrar: "Error: Mensaje dañado durante la transmisión". Nunca mostrar basura.

### Escenario 2: Clave Privada Incorrecta
*   **Situación:** El usuario cambió de móvil o reinstaló la app (generando nuevas llaves), pero su amigo le envió un mensaje usando la Clave Pública antigua.
*   **Reacción:**
    *   El paso 2 (Descifrar la clave efímera) fallará matemáticamente porque la Clave Privada actual no coincide con la Pública usada.
*   **Acción:** Mostrar: "No se puede descifrar. Este mensaje fue enviado a una identidad tuya antigua o revocada".

### Escenario 3: Rendimiento con Archivos Grandes
*   **Situación:** Se intenta cifrar un vídeo de 50MB. Cargar todo en un Buffer de JS puede crashear la app por falta de RAM.
*   **Solución (Streaming):**
    *   El programador debe usar Streams o cifrado por bloques (Chunks) para archivos adjuntos.
    *   Leer 1MB del disco -> Cifrar -> Escribir 1MB en archivo temporal cifrado.
    *   Nunca cargar el archivo entero en variables de JavaScript.

### Escenario 4: Reutilización de IV (Pecado Capital)
*   **Riesgo:** Si usamos el mismo IV con la misma clave para dos mensajes distintos, un atacante puede descifrarlos.
*   **Control:** El generador de IV debe llamar siempre a `SecureRandom` para obtener 12 bytes nuevos en cada mensaje. Nunca usar un contador ni valores fijos.

## 5. Resumen del Flujo de Datos

Para el desarrollador, esta función es una caja negra con entradas y salidas claras:

**Input:**
*   Texto plano (String) o Ruta de archivo (path).
*   Clave Pública del Destinatario (String Base64/Hex).

**Process:**
1.  `Key = Random(32)`
2.  `EncryptedMsg = AES_GCM(Msg, Key)`
3.  `EncryptedKey = ECC_Encrypt(Key, PubKey)`
4.  `Packet = EncryptedKey + EncryptedMsg`

**Output:**
*   Buffer (Array de bytes) listo para esteganografía.

</div>
