# Criptografía

## Primitivas

- RSA-2048 para identidad, firmas y encapsulado de clave.
- SHA256withRSA para firmar challenges.
- RSA-OAEP-SHA256 para cifrar la clave AES efímera.
- AES-256-GCM para contenido.
- SHA-256 para HNET-id y fingerprints.
- PBKDF2 + AES-256-GCM para backups `.hnet`.

## Implementación

- Frontend: `react-native-quick-crypto`.
- Fallback controlado: `CryptoService.ts` con `node-forge` donde aplica.
- Backend: Java Security para verificar firmas, JJWT para tokens.

## Formato Mensaje

```text
[2B longitud RSA][RSA(AES-key)][12B IV][16B authTag][ciphertext]
```

## Reglas

- No loguear private keys ni JWT completos.
- El servidor nunca descifra payloads.
- El receptor descarta paquetes que no validen AES-GCM, fingerprint o anti-replay.
