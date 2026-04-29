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
- **TOFU** (Trust On First Use) para intercambio de claves vía QR.
- **Verificación de fingerprint** del HNET-id contra la pk recibida — bloquea suplantación.
- **Blind push**: notificaciones FCM vacías que solo despiertan la app para sincronizar.
- **Auto-destrucción**: N fallos de PIN → se borra la key store local.
- **Servidor zero-knowledge**: jamás conoce contenido, identidades reales, ni clave privada.

Más detalle: `docs/anteproyecto.md`, `docs/technical/descripcion_detallada.md`.
