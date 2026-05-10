# Intercambio de Claves por QR

Hermnet añade contactos mediante intercambio explícito de identidad. La implementación actual usa QR.

## 1. Payload

El QR contiene la identidad pública del usuario:

```json
{
  "id": "HNET-...",
  "publicKey": "-----BEGIN PUBLIC KEY-----..."
}
```

El alias se decide localmente al guardar el contacto.

## 2. Validación Anti-Spoofing

Al escanear un QR, la app comprueba:

1. El JSON es válido.
2. Existen `id` y `publicKey`.
3. El ID empieza por `HNET-`.
4. La clave pública tiene formato PEM.
5. `HNET-` + `SHA-256(publicKey)[0:16]` coincide con el `id`.

Si no coincide, se rechaza el QR. Esto evita asociar una clave pública falsa a un HNET-id ajeno.

## 3. Modelo de Confianza

Hermnet sigue TOFU (Trust On First Use):

- El QR se intercambia por un canal que el usuario considera confiable.
- La app verifica coherencia criptográfica entre ID y clave.
- Una vez guardado, el contacto queda en SQLite local.

## 4. Persistencia

El contacto se guarda en `contacts_vault` con:

- `contact_hash`;
- `public_key`;
- alias local opcional;
- flags locales como bloqueado, fijado, silenciado, archivado y colores de avatar.

## 5. Fuera de Alcance Actual

Los deep links `hermnet://invite?...` no están implementados actualmente. El flujo soportado es QR.
