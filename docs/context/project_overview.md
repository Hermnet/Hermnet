# Hermnet

Mensajería privada con cifrado extremo a extremo y servidor ciego.

## Objetivos

- No pedir teléfono, email ni contraseña.
- Generar identidad local RSA-2048.
- Derivar HNET-id desde `SHA-256(publicKey)`.
- Cifrar mensajes con AES-256-GCM + RSA-OAEP-SHA256.
- Usar el backend como buzón temporal opaco.
- Mantener historial y contactos en SQLite local.
- Ofrecer backup cifrado `.hnet`.

## Funcionalidades Clave

- Registro y login challenge-response.
- JWT con refresh/logout y blacklist.
- QR de contactos con anti-spoofing.
- Envío/recepción de mensajes E2EE.
- Cola offline.
- Camuflaje visual de mensajes antiguos.
- ACK seguro con cutoff.
- Push ciega opcional.
- Tor-ready en Android.
- Tests backend/frontend verificados.

## Fuera de Alcance

- Esteganografía.
- Deep links.
- Cliente de escritorio.
- Silent refresh proactivo.
