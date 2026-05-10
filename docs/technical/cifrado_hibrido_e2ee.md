# Cifrado Híbrido E2EE

Hermnet cifra cada mensaje antes de enviarlo al backend. El servidor solo recibe un blob binario opaco.

## 1. Primitivas

| Uso | Algoritmo |
|---|---|
| Cifrado del contenido | AES-256-GCM |
| Encapsulado de clave | RSA-OAEP-SHA256 con RSA-2048 |
| Aleatoriedad | CSPRNG (`randomBytes`) |
| Fingerprint de identidad | SHA-256 |

La implementación principal está en `frontend/services/MessageCryptoService.ts`.

## 2. Envío

1. La app construye un sobre JSON con remitente, clave pública, texto, timestamp y metadatos de seguridad.
2. Genera una clave AES efímera de 32 bytes.
3. Genera un IV de 12 bytes.
4. Cifra el sobre con AES-256-GCM.
5. Cifra la clave AES con la clave pública RSA del receptor usando OAEP-SHA256.
6. Empaqueta todo en un `Uint8Array`.

Formato:

```text
[2B longitud RSA][RSA(AES-key)][12B IV][16B authTag][ciphertext]
```

El paquete se manda al backend como `payload` en `POST /api/messages`.

## 3. Recepción

1. La app lee los 2 primeros bytes para saber la longitud del bloque RSA.
2. Extrae clave cifrada, IV, tag y ciphertext.
3. Descifra la clave AES con la privateKey local.
4. Descifra el sobre con AES-256-GCM.
5. Si el tag no valida, descarta el paquete.
6. Verifica que el `from` coincide con el fingerprint de la `pk` recibida.

## 4. Seguridad

- AES-GCM aporta confidencialidad e integridad.
- RSA solo cifra la clave AES, nunca el mensaje completo.
- Cada mensaje usa clave AES efímera.
- El servidor no puede descifrar ni validar contenido.
- Paquetes corruptos o manipulados no se guardan en el historial local.

## 5. Compatibilidad

El proyecto usa `react-native-quick-crypto`. Existe un wrapper de compatibilidad (`CryptoService`) para evitar que el import nativo rompa en entornos donde el módulo Nitro no esté disponible.
