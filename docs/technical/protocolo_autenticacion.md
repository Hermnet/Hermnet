# Protocolo de Autenticación

Hermnet autentica sin contraseñas. El usuario demuestra que posee la clave privada asociada a su HNET-id firmando un reto temporal.

## 1. Flujo Challenge-Response

1. El cliente solicita un reto:

```http
POST /api/auth/challenge
```

```json
{ "userId": "HNET-..." }
```

2. El backend valida que el usuario existe, elimina retos anteriores del mismo usuario, genera un `nonce` y lo guarda con caducidad corta.

3. El cliente firma el `nonce` con su clave privada RSA:

```text
SHA256withRSA(nonce, privateKey)
```

4. El cliente completa login:

```http
POST /api/auth/login
```

```json
{
  "nonce": "...",
  "signedNonce": "base64..."
}
```

5. El backend verifica la firma con la `publicKey` registrada y emite un JWT.

## 2. JWT

- Algoritmo: HS256.
- Secret: `JWT_SECRET`, mínimo 32 bytes.
- Duración por defecto: 15 minutos.
- Cada token incluye `jti` único para revocación.

Si el secret falta o es demasiado corto, el backend falla al arrancar.

## 3. Refresh y Logout

`POST /api/auth/refresh`:

- requiere Bearer token;
- valida el JWT;
- comprueba que el `jti` no está revocado;
- revoca el token actual;
- emite un token nuevo.

`POST /api/auth/logout`:

- revoca el token actual;
- es idempotente.

## 4. Tratamiento de Errores

- Nonce inexistente: error de login.
- Nonce expirado: se elimina y se rechaza.
- Firma inválida: login rechazado.
- Token revocado: request protegida rechazada.
- Usuario no encontrado al refrescar: refresh rechazado.

## 5. PIN Local

El PIN no participa en el protocolo remoto. Sirve para desbloquear la interfaz local y validar que quien usa el dispositivo conoce el PIN configurado.

La clave privada sigue protegida por SecureStore del sistema operativo.
