# Estado Actual

Última revisión: 2026-05-10.

## Verificado

- Backend `mvn verify`: correcto.
- Cobertura backend JaCoCo: 99.28%.
- Umbral backend obligatorio: 98% líneas.
- Frontend `npx tsc --noEmit`: correcto.
- Frontend Jest: 9 suites, 33 tests.

## Implementado

### Backend

- Registro, challenge, login, refresh y logout.
- JWT HS256 con `jti` y blacklist.
- Mensajería con buzón opaco: send, fetch, ack con cutoff.
- Firebase opcional para push ciega.
- IP anonymization con HMAC-SHA256 y sal rotativa.
- Rate limit por cliente anonimizado.
- Retención periódica de mailbox, challenges y blacklist.
- Migración `stego_packet -> payload`.

### Frontend

- Identidad RSA-2048 local.
- PIN local y biometría.
- QR de contactos con validación anti-spoofing.
- Cifrado híbrido E2EE.
- Cola offline de mensajes.
- ACK de inbox tras procesar.
- Orden estable por `msg_id`.
- Camuflaje visual de mensajes antiguos.
- Chat list con unread count y preview camuflada.
- Backup `.hnet`.
- Ajustes, apariencia, seguridad y transferencia.
- Tor-ready Android con fallback clearnet.

## Fuera de Alcance

- Esteganografía PNG.
- Deep links de invitación.
- Cliente escritorio.
- Silent refresh proactivo.
