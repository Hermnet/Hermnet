# Descripción Técnica Detallada de Hermnet

Este documento consolida la especificación técnica completa del sistema Hermnet, abarcando desde la criptografía local hasta la infraestructura de servidor y los protocolos de recuperación.

---

## 1. Generación de Llaves y Hash (Lógica en el Móvil)
Todo empieza en el dispositivo del usuario. Al abrir la app por primera vez, generamos la identidad.

### A. El Par de Llaves (React Native)
Utilizaremos una librería como `react-native-quick-crypto` o `tweetnacl`. La clave privada se guarda en el **SecureStore** (el búnker del móvil) y nunca sale de ahí.

*   **SK** = Clave Privada (Secreta)
*   **PK** = Clave Pública (Tu dirección)

### B. Creación del Hash (Tu ID de Hermnet)
Para que el usuario no tenga que compartir una clave pública larguísima, generamos un Hash único.
1.  Tomamos la `PK`.
2.  Aplicamos **SHA-256**.
3.  El resultado lo truncamos o lo pasamos a **Base58** (estilo Bitcoin) para que sea un ID legible como: `HNET-7a2b-91zM`.

---

## 2. El Protocolo de Autenticación (Challenge-Response)
Aquí es donde el Backend y la App hablan entre sí para iniciar sesión sin contraseñas. Olvídate del típico formulario; esto es Seguridad de Grado Militar.

### El Flujo Técnico:
1.  **Petición de Reto:** El móvil envía su Hash ID al servidor.
2.  **El "Challenge" (Reto):** El servidor genera un número aleatorio único y temporal (un *nonce*) y lo guarda en la base de datos asociado a ese usuario.
3.  **La Firma:** El móvil recibe el reto y lo firma usando su Clave Privada localmente.
    *   $$Firma = \text{sign}(\text{reto}, SK)$$
4.  **Verificación:** El móvil envía la firma de vuelta. El servidor, que tiene la Clave Pública del usuario en su tabla `users`, verifica si la firma es válida para ese reto.
5.  **Emisión de JWT:** Si la firma es correcta, el servidor emite un **JWT** (JSON Web Token) para que el usuario pueda navegar por la API.

---

## 3. Vinculación por QR (Intercambio de Identidad)
Para agregar a un amigo, el móvil genera un código QR que contiene un JSON con la información necesaria.

### Estructura del QR:
```json
{
  "h": "HNET-7a2b-91zM",
  "pk": "MCowBQYDK2VwAyEAG93...",
  "n": "Álvaro_Pro"
}
```
*   `h`: Tu ID.
*   `pk`: Tu clave pública (necesaria para cifrar mensajes).
*   `n`: Un alias local (opcional).

---

## 4. Base de Datos del Servidor (Backend)
*   **Motor:** PostgreSQL / MySQL.
*   **Objetivo:** Enrutamiento, Seguridad de Sesión e Infraestructura.

### 1. Módulo de Identidad y Sesión

#### A. Tabla `users` (Directorio Público)
Almacena las identidades criptográficas.
| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `id_hash` (PK) | VARCHAR(64) | Identificador único (SHA-256 + Base58). |
| `public_key` | TEXT | Clave Pública Ed25519. |
| `push_token` | TEXT | Token FCM/APNs para notificaciones ciegas. |
| `created_at` | TIMESTAMP | Fecha de registro. |

#### B. Tabla `auth_challenges`
Almacena los retos temporales.
| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `challenge_id` (PK) | BIGSERIAL | ID autoincremental. |
| `user_hash` (FK) | VARCHAR(64) | Usuario que intenta autenticarse. |
| `nonce` | VARCHAR(64) | Número aleatorio criptográficamente seguro. |
| `expires_at` | TIMESTAMP | TTL corto (ej. 30 segundos). |

#### C. Tabla `token_blacklist`
Lista de revocación para tokens.
| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `jti` (PK) | VARCHAR(36) | ID único del Token JWT. |
| `revoked_reason` | VARCHAR(50) | 'LOGOUT', 'ROTATION'. |
| `expires_at` | TIMESTAMP | Fecha de expiración natural. |

### 2. Módulo de Transporte (Mensajería)

#### D. Tabla `mailbox` (Buzón de Tránsito)
Almacenamiento temporal. Se borra tras la entrega.
| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `message_id` (PK) | BIGSERIAL | ID del paquete. |
| `recipient_hash` | VARCHAR(64) | Hash del destinatario (Indexado). |
| `image_blob` | LONGBLOB | Archivo PNG con mensaje oculto. |
| `created_at` | TIMESTAMP | Fecha de recepción. |

### 3. Módulo de Infraestructura

#### E. Tabla `app_versions`
| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `version_code` (PK) | INTEGER | Código de versión. |
| `is_mandatory` | BOOLEAN | Bloqueo de versiones antiguas. |
| `changelog` | TEXT | Notas de la versión. |

#### F. Tabla `rate_limit_buckets`
| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `ip_hash` (PK) | VARCHAR(64) | Hash diario de la IP. |
| `request_count` | INTEGER | Peticiones en ventana actual. |
| `reset_time` | TIMESTAMP | Reinicio del contador. |

---

## 5. El Cifrado Híbrido (Antes de esconderlo)
Sistema de dos capas:
1.  **Cifrado Simétrico (AES-256):** Ciframos el mensaje con una clave aleatoria.
2.  **Cifrado Asimétrico (ECC):** Ciframos esa clave aleatoria con la Clave Pública del receptor.
*   **Resultado:** Un "paquete" binario que solo el receptor puede abrir.

---

## 6. Algoritmo de Esteganografía
Usamos la técnica LSB (Least Significant Bit) en imágenes **PNG**.
*   **Lógica:** Cambiamos el último bit de cada canal RGB.
*   **Invisibilidad:** El ojo humano no distingue entre el valor 200 y 201 en un color.
*   **Formato:** PNG obligatorio (Lossless). JPG destruiría los datos.

---

## 7. Flujo de Trabajo en el Móvil
1.  **Selección de Imagen:** La app elige una imagen de cobertura.
2.  **Preparación:** El mensaje cifrado se convierte en bits.
3.  **Inyección:** Se sustituyen los bits LSB de los píxeles.
4.  **Delimitador:** Se añade una secuencia de fin.
5.  **Guardado:** Se genera el nuevo PNG.

---

## 8. El Papel del Servidor
Arquitectura Zero-Knowledge:
*   Recibe POST con `MultipartFile`.
*   Guarda en `mailbox`.
*   **Limpieza:** Puede borrar metadatos EXIF, pero **nunca** comprimir o redimensionar.

---

## 9. Escudo de Imágenes Sintéticas
Para evitar *fingerprinting* del dispositivo:
*   El sistema genera o provee imágenes neutrales.
*   Evita metadatos personales del usuario.
*   Optimización: Imágenes pre-descargadas para evitar latencia.

---

## 10. Anonimización de la IP (Escudo Ciego)
1.  **Filtrado de Aplicación:** Se intercepta la petición.
2.  **Hashing Diario:** `SHA-256(IP + Salt_Diario)`.
    *   Permite Rate Limiting diario pero impide rastreo histórico.
3.  **Logs:** Configuración para no registrar IPs reales.

---

## 11. Tráfico Uniforme
Para evitar análisis de tráfico por tamaño de paquete:
*   **Normalización:** Todas las imágenes se rellenan con ruido hasta pesar lo mismo (ej. 1.5MB).

---

## 12. Gestión de Tokens (Seguridad de Sesión)
*   **JTI:** ID único en cada JWT.
*   **Blacklist:** Revocación inmediata en cierre de sesión o rotación.
*   **Silent Refresh:** Renovación automática cada pocos minutos para reducir la ventana de ataque.

---

## 13. Notificaciones Push Anonimizadas (Blind Push)
1.  **Registro:** El token FCM/APNs se asocia al `id_hash`.
2.  **Envío "Ciego":** El servidor envía un JSON vacío `{"action": "sync_new_msg"}`.
3.  **Recepción:**
    *   La app despierta en segundo plano.
    *   Descarga la imagen.
    *   Descifra localmente.
    *   Muestra notificación: "Nuevo mensaje".
    *   Google/Apple nunca ven el contenido ni el emisor.

---

## 14. Persistencia Local (SQLite - Offline First)

### A. Tabla `key_store` (El Búnker)
| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` (PK) | INTEGER | Identificador único. |
| `encrypted_sk` | BLOB | Clave Privada cifrada (AES-GCM). |
| `auth_tag` | BLOB | Tag de autenticación. |

### B. Tabla `contacts_vault` (Agenda)
| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `contact_hash` (PK) | TEXT | ID del contacto. |
| `public_key` | TEXT | Su Clave Pública. |
| `alias_local` | TEXT | Nombre asignado (ej. "Mamá"). |

### C. Tabla `messages_history`
| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `msg_id` (PK) | INTEGER | ID. |
| `content_encrypted` | BLOB | Texto cifrado localmente. |
| `status` | TEXT | PENDING, SENT, DELIVERED. |

### D. Tabla `sync_queue`
Cola de tareas para funcionamiento sin internet.

### E. Tabla `cover_images`
Caché de imágenes base para esteganografía.

---

## 15. Archivo de Respaldo (.hnet) (Único Método de Recuperación)
Como no hay nube ni contraseñas, ni usamos frases de 12 palabras, la exportación local es vital:
1.  **Empaquetado:** Volcado de la BD SQLite completa en un fichero.
2.  **KDF:** Derivación de clave desde una Contraseña de Respaldo definida por el usuario.
3.  **Cifrado:** AES-256-GCM.
4.  **Resultado:** Archivo `generado.hnet` listo para ser guardado (Drive, local, pendrive). Solo con este archivo y la contraseña de respaldo se puede restaurar la cuenta en caso de pérdida de dispositivo.

---

## 16. Sincronización PC (The Bridge)
*   Túnel P2P local (vía QR).
*   Transferencia de Clave Privada cifrada.
*   El PC actúa como un espejo independiente.
