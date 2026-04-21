# Hermnet — visión

Mensajería instantánea **Zero-Knowledge** con **esteganografía LSB** sobre PNG.

## Objetivos
- Privacidad extrema: el servidor no sabe quién habla con quién ni qué se dice.
- Identidad sin teléfono ni email: solo par de claves Ed25519/X25519 generadas localmente.
- Los mensajes viajan ocultos dentro de imágenes PNG (stego), indistinguibles de tráfico de fotos.
- Buzón temporal en servidor (purga 48h) → el usuario es el único que conserva historia, en SQLite cifrada.

## Usuarios objetivo
Periodistas, activistas, profesionales de seguridad, cualquiera que quiera anonimato reforzado.

## Principios de diseño
- **TOFU** (Trust On First Use) para intercambio de claves vía QR / deep link.
- **Blind push**: notificaciones vacías que solo despiertan la app para sincronizar.
- **Auto-destrucción**: N fallos de PIN → se borra la key store local.
- **Todos los PNG pesan ~1.5MB** (relleno de ruido) para que no se pueda distinguir tamaño del mensaje.

Más detalle: `docs/anteproyecto.md`, `docs/technical/descripcion_detallada.md`.
