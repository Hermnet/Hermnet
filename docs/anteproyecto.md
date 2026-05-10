# Anteproyecto Hermnet

## 1. Resumen

Hermnet es una aplicación móvil de mensajería privada cuyo objetivo es demostrar una arquitectura de comunicación con servidor ciego. El servidor no almacena conversaciones en claro ni conoce el contenido de los mensajes. Su papel es autenticar, transportar payloads cifrados y limpiar datos temporales.

El proyecto nace como trabajo final de DAM y está preparado también como portfolio técnico: combina React Native, Expo, Spring Boot, PostgreSQL, SQLite, criptografía aplicada, tests automatizados y documentación técnica.

## 2. Objetivos

- Crear una app de mensajería funcional para Android/iOS.
- Evitar registro con teléfono, email o contraseña.
- Generar identidades criptográficas en el dispositivo.
- Cifrar mensajes extremo a extremo.
- Mantener el historial solo en el dispositivo.
- Usar el backend como buzón temporal zero-knowledge.
- Permitir backup cifrado `.hnet`.
- Facilitar arranque del proyecto tras clonar el repositorio.
- Alcanzar alta calidad de backend con tests y cobertura superior al 98%.

## 3. Flujo de Usuario

### Crear Identidad

Al abrir la app por primera vez, el dispositivo genera un par RSA-2048. La clave privada queda en SecureStore y la clave pública se registra en el backend. El HNET-id se deriva del fingerprint SHA-256 de la clave pública.

### Añadir Contactos

Los contactos se añaden por QR. La app valida que la clave pública corresponde al HNET-id recibido, evitando asociar claves falsas a identidades ajenas.

### Enviar Mensajes

El mensaje se empaqueta en un sobre JSON y se cifra con AES-256-GCM. La clave AES efímera se cifra con RSA-OAEP-SHA256 usando la clave pública del receptor. El backend solo recibe un payload opaco.

### Recibir Mensajes

La app consulta su buzón, descifra localmente los payloads, valida anti-spoofing y anti-replay, guarda el mensaje en SQLite y envía un ACK para borrar lo procesado del servidor.

### Recuperar Datos

El usuario puede exportar un archivo `.hnet` cifrado con contraseña. Este archivo contiene identidad, contactos y mensajes para migrar de dispositivo o restaurar.

## 4. Stack Técnico

| Área | Tecnología |
|---|---|
| App móvil | React Native, Expo SDK 54, TypeScript |
| Navegación | Expo Router |
| Estado | Zustand |
| Persistencia local | Expo SQLite, Expo SecureStore |
| Criptografía cliente | `react-native-quick-crypto` |
| Backend | Java 17, Spring Boot, Spring Security |
| Persistencia backend | PostgreSQL |
| Auth | Challenge-response + JWT HS256 |
| Push | Firebase Admin SDK opcional |
| Tests | JUnit, JaCoCo, Jest, TypeScript strict |

## 5. Bases de Datos

### Backend

- `users`: HNET-id, clave pública, push token opcional.
- `auth_challenges`: nonces temporales para login.
- `mailbox`: payloads cifrados en tránsito.
- `token_blacklist`: JWT revocados.
- `rate_limit_buckets`: rate limit por IP anonimizada.

### Dispositivo

- `contacts_vault`: contactos y preferencias locales.
- `messages_history`: historial de mensajes local.
- `sync_queue`: cola offline.
- `incoming_seq`: control anti-replay.
- Preferencias y datos sensibles repartidos entre SQLite y SecureStore.

## 6. Seguridad

- No hay contraseñas remotas.
- La clave privada no sale del dispositivo.
- El servidor no descifra mensajes.
- AES-GCM detecta manipulación de payloads.
- El HNET-id se verifica contra la clave pública recibida.
- JWT con `jti` revocable.
- IP anonimizada y rate limiting.
- Push notifications sin contenido sensible.

## 7. Alcance

Implementado:

- identidad criptográfica local;
- login challenge-response;
- mensajes E2EE;
- QR de contactos;
- chat local con historial;
- cola offline;
- backup `.hnet`;
- camuflaje visual de mensajes;
- ajustes de seguridad, apariencia y transferencia;
- backend con cobertura superior al 98%.

Fuera de alcance actual:

- esteganografía en imágenes;
- deep links de invitación;
- cliente de escritorio;
- silent refresh proactivo.

## 8. Valor del Proyecto

Hermnet demuestra integración real entre móvil, backend, criptografía aplicada, persistencia local, seguridad operativa y experiencia de usuario. Es un proyecto adecuado para evaluación académica y para mostrar en portfolio profesional porque cubre arquitectura, producto, calidad de código, testing y documentación.
