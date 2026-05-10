# Generación de Identidad

Hermnet no registra usuarios mediante email, teléfono o contraseña. La identidad se crea localmente en el dispositivo.

## 1. Claves

La app genera un par de claves RSA-2048:

- **privateKey**: permanece en el dispositivo y se guarda en SecureStore.
- **publicKey**: se registra en el backend y se comparte por QR con otros usuarios.

La clave privada se usa para firmar challenges de autenticación. La clave pública se usa para verificar esas firmas y para que otros clientes puedan cifrar mensajes destinados al usuario.

## 2. HNET-id

El identificador público se deriva de la clave pública:

```text
HNET- + SHA-256(publicKey).hex().substring(0, 16).toUpperCase()
```

Esto permite verificar que una clave pública pertenece al HNET-id que declara. Si alguien intenta enviar una clave pública distinta asociada a un HNET-id ajeno, la app recalcula el fingerprint y descarta el paquete.

## 3. Persistencia Local

La identidad se guarda en Expo SecureStore en claves separadas:

- `identity_id`
- `identity_publicKey`
- `identity_privateKey`

Separar la identidad evita superar límites prácticos de SecureStore en algunas plataformas.

## 4. PIN y Biometría

El PIN de 6 dígitos protege el acceso local a la app. Se almacena como hash asociado a la identidad, no como PIN en claro.

La biometría se usa como desbloqueo rápido cuando el dispositivo lo permite.

## 5. Registro Backend

Al crear identidad, el cliente llama:

```http
POST /api/auth/register
```

Con:

```json
{
  "id": "HNET-...",
  "publicKey": "-----BEGIN PUBLIC KEY-----...",
  "pushToken": "opcional"
}
```

El servidor solo guarda `id`, `publicKey`, `pushToken` opcional y `createdAt`.
