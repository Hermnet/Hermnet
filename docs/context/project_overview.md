# Hermnet — visión

Mensajería **Zero-Knowledge** con **cifrado de extremo a extremo** sobre un servidor opaco.

## Objetivos
- Privacidad extrema: el servidor no puede leer el contenido de los mensajes ni metadatos sensibles.
- Identidad sin teléfono ni email: solo par de claves RSA-2048 generadas localmente; el HNET-id es el fingerprint SHA-256 de la clave pública.
- Mensajes cifrados con esquema híbrido AES-256-GCM + RSA-OAEP — el servidor solo ve un blob binario opaco.
- Buzón temporal en servidor (purga periódica) → el usuario es el único que conserva historia, en SQLite local.

## Usuarios objetivo
Periodistas, activistas, profesionales de seguridad, cualquiera que quiera anonimato reforzado.

## Principios de diseño
- **TOFU** (Trust On First Use) para intercambio de claves vía QR presencial.
- **Verificación de fingerprint** del HNET-id contra la pk recibida — bloquea suplantación.
- **Blind push**: notificaciones FCM vacías que solo despiertan la app para sincronizar.
- **Servidor zero-knowledge**: jamás conoce contenido, identidades reales, ni clave privada.
- **Offline-first**: historial de mensajes en SQLite local; el servidor solo es un buzón temporal.

## Funcionalidades implementadas
- Generación de identidad RSA-2048 local (sin registro con datos personales).
- Autenticación challenge-response (firma RSA + JWT HS256).
- Cifrado híbrido E2EE (AES-256-GCM + RSA-OAEP-SHA256).
- Intercambio de claves por QR presencial (TOFU).
- Envío/recepción de mensajes cifrados con sincronización automática.
- Archivo de respaldo `.hnet` (PBKDF2 + AES-256-GCM) para recuperación.
- PIN de 6 dígitos con flujo de creación en 2 pasos.
- Biometría (huella/FaceID) para desbloqueo rápido.
- Personalización visual de chat (colores de burbujas, patrones de fondo).
- Modo Matrix (mensajes scrambled para privacidad visual, con auto-reveal de mensajes nuevos).
- Onboarding con carrusel de 5 diapositivas animadas.
- Pantalla de pánico (botón de wipe de emergencia).
- Detección de root/jailbreak.
- Notificaciones push ciegas (FCM).
- Anonimización de IP (SHA-256 diario).
- Rate limiting por IP hash.
- Blacklist de JWT con revocación por jti.
- Transiciones animadas entre pantallas (fade, slide horizontal).

## No implementado / Fuera de alcance
- **The Bridge (sync PC P2P):** fuera del alcance del TFG.
- **Silent refresh automático en cliente:** solo renovación reactiva al recibir 401.
- **Esteganografía:** la documentación original describía ocultar mensajes en PNG 1.5MB; la implementación real usa payloads base64 cifrados directamente.
- **Deep linking** (`hermnet://invite?data=...`): no implementado, el intercambio es solo por QR.
- **Tests frontend:** sin cobertura de tests automatizados.
- **Protección KDF de clave privada con PIN:** la clave privada se almacena directamente en SecureStore (cifrado del SO), sin capa KDF adicional.

Más detalle: `docs/anteproyecto.md`, `docs/technical/descripcion_detallada.md`.
