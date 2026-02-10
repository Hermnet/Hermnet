## Generación de Identidad y Criptografía Local

<div style="text-align: justify; text-indent: 20px;">


## 1. Arquitectura de Identidad Descentralizada

El sistema de identidad de Hermnet se basa en principios de criptografía asimétrica generada localmente (Local Key Generation). A diferencia de los sistemas centralizados tradicionales, no existe un registro de usuarios asociado a datos personales (correo, teléfono).

La identidad del usuario se define estrictamente como un par de claves criptográficas y su identificador derivado. Este proceso ocurre exclusivamente en el dispositivo del cliente, garantizando que la clave privada nunca abandone el entorno seguro del usuario.

El módulo de identidad tiene dos responsabilidades críticas:
1.  **Generación de Claves:** Creación de pares de llaves Ed25519 para firma y cifrado.
2.  **Protección en Reposo:** Cifrado simétrico de la clave privada utilizando un derivado del PIN del usuario antes de su persistencia en el almacenamiento local.

## 2. Especificaciones Tecnológicas

El módulo utiliza los siguientes primitivos criptográficos y estándares:

| Componente | Estándar / Implementación | Función Técnica |
| :--- | :--- | :--- |
| **Algoritmo de Clave** | **Ed25519 / X25519** | Curva elíptica de alto rendimiento para firmas digitales e intercambio de claves (ECDH). |
| **Identificador (ID)** | **Base58 Check** | Codificación del hash de la clave pública para generar identificadores legibles y libres de caracteres ambiguos. |
| **Persistencia Segura** | **AES-256-GCM** | Cifrado simétrico autenticado para el almacenamiento de la clave privada en la base de datos SQLite local. |
| **Derivación de Clave** | **PBKDF2-HMAC-SHA512** | Función de derivación de clave (KDF) con alto conteo de iteraciones para proteger la clave privada contra ataques de fuerza bruta. |

## 3. Política de "Creación del Búnker"

El registro en Hermnet no pide correo ni teléfono. El proceso se basa en "Lo que tienes" (el móvil) y "Lo que sabes" (el PIN).

### A. Generación Soberana
La identidad se crea en la memoria RAM del dispositivo. El servidor no interviene en la generación de las llaves, garantizando que nadie más tiene copia de ellas.

### B. El PIN como Constructor
El usuario debe elegir un PIN de seguridad (ej. 6 dígitos) durante el registro.
*   Este PIN **NO** se envía al servidor.
*   Este PIN se utiliza exclusivamente para cifrar la Clave Privada antes de guardarla por primera vez.

## 4. Flujo Lógico Detallado (Narrativa del Registro)

El proceso de creación de cuenta sigue estos cuatro pasos críticos:

### Paso 1: La Matemáticas (En Memoria RAM)
Al pulsar "Crear Cuenta", el motor criptográfico se despierta:
1.  Genera un par de claves Ed25519 (Pública y Privada).
2.  Toma la Clave Pública, le aplica un hash SHA-256 y lo comprime en Base58 para crear el Hermnet ID (ej: `HNET-7a2b91zM`).
3.  **Estado:** En este momento, la Clave Privada está "desnuda" en la memoria RAM. Es el momento más vulnerable y debe durar milisegundos.

### Paso 2: El Sellado (Cifrado AES-GCM)
La app solicita al usuario: "Crea tu PIN de seguridad".
1.  El usuario introduce `123456`.
2.  **Derivación (KDF):** La app mezcla el PIN con una "Sal" (Salt) aleatoria y aplica miles de iteraciones para obtener una Clave Maestra de Cifrado.
3.  **Cierre de la Caja:** La app toma esa Clave Maestra y cifra la Clave Privada "desnuda" usando AES-256-GCM.
4.  **Resultado:** Obtenemos un bloque de datos ilegibles (el Ciphertext) y un sello de autenticidad (el Tag).

### Paso 3: La Persistencia (Guardado Seguro)
Ahora que la clave privada ya no es texto plano, sino un bloque cifrado seguro:
1.  **Almacenamiento Local:** Se guarda el bloque cifrado + la Sal + el Tag en la tabla `key_store` de SQLite.
2.  **Registro Público:** Se envía la Clave Pública y el ID al servidor para que el usuario exista en el directorio de Hermnet.

### Paso 4: La Limpieza (Wipe)
Inmediatamente después de confirmar que los datos se han guardado:
1.  La Clave Privada original se borra de la RAM.
2.  El PIN se borra de la RAM.
3.  La Clave Maestra derivada se borra de la RAM.
4.  **Resultado:** El dispositivo queda "frío". Para volver a usar la identidad, el usuario necesitará introducir el PIN de nuevo (ver Documento 02).

## 5. Estructura de Datos Resultante

Al finalizar el registro, esto es lo único que queda almacenado en el dispositivo. Fíjate que la clave privada **NO** existe en formato legible.

### En SQLite (Tabla `key_store` - La Bóveda):
Esta tabla es el corazón de la seguridad local.

| Columna | Tipo de Dato | Descripción |
| :--- | :--- | :--- |
| `id_hash` | TEXT | El ID del usuario (HNET-7a...). |
| `encrypted_sk` | BLOB | La Clave Privada cifrada (basura ilegible sin el PIN). |
| `auth_tag` | BLOB | El sello de seguridad del algoritmo GCM. |
| `kdf_salt` | BLOB | La "sal" aleatoria usada para fortalecer el PIN. |
| `iv` | BLOB | El vector de inicialización del cifrado. |

### En SQLite (Tabla `users` - Perfil Público):
Datos que no requieren protección extrema y sirven para la UI.

| Columna | Valor (Ejemplo) | Descripción |
| :--- | :--- | :--- |
| `public_key` | `f9e8d7c6...` | Tu llave pública (se puede compartir). |
| `alias_local` | "Yo" | Nombre para mostrar en la app. |

## 6. Recuperación y Fallos

¿Qué pasa si el registro falla a mitad?

*   **Atomicidad:** Si la app se cierra antes de completar el paso 3 (guardado), nada se guarda. Al volver a abrir, se inicia el proceso desde cero generando nuevas llaves.
*   **Olvido de PIN inmediato:** Como el PIN nunca se envía al servidor, si el usuario olvida el PIN 10 segundos después de crearlo, la cuenta es inaccesible. La app debe advertir esto claramente: "Sin este PIN, perderás tu identidad para siempre".

</div>
