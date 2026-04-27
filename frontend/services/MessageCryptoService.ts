import QuickCrypto from 'react-native-quick-crypto';
import { Buffer } from 'buffer';

/**
 * Cifrado híbrido RSA-OAEP + AES-256-GCM.
 *
 * RSA-2048 OAEP-SHA256 solo permite cifrar 190 bytes; el sobre del mensaje
 * (que incluye la clave pública del remitente) supera ese límite, por lo que
 * se usa RSA únicamente para cifrar la clave AES de un solo uso, y AES-GCM
 * para cifrar el contenido real.
 *
 * Formato del payload de salida (todo en un único Uint8Array):
 *   [2 bytes BE: longitud N de la clave RSA cifrada]
 *   [N bytes: clave AES cifrada con RSA-OAEP-SHA256]
 *   [12 bytes: IV de AES-GCM]
 *   [16 bytes: authTag de AES-GCM]
 *   [resto: ciphertext]
 */
export class MessageCryptoService {
  private static readonly IV_LENGTH = 12;
  private static readonly TAG_LENGTH = 16;
  private static readonly AES_KEY_LENGTH = 32;

  encryptForRecipient(plaintext: string, recipientPublicKey: string): Uint8Array {
    const aesKey = (QuickCrypto as any).randomBytes(MessageCryptoService.AES_KEY_LENGTH) as Buffer;
    const iv = (QuickCrypto as any).randomBytes(MessageCryptoService.IV_LENGTH) as Buffer;

    const cipher = (QuickCrypto as any).createCipheriv('aes-256-gcm', aesKey, iv);
    const ciphertext = Buffer.concat([
      cipher.update(Buffer.from(plaintext, 'utf8')),
      cipher.final(),
    ]) as Buffer;
    const authTag = cipher.getAuthTag() as Buffer;

    const encryptedKey = (QuickCrypto as any).publicEncrypt(
      {
        key: recipientPublicKey,
        padding: (QuickCrypto as any).constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      aesKey
    ) as Buffer;

    const keyLength = encryptedKey.length;
    const lengthHeader = Buffer.from([(keyLength >> 8) & 0xff, keyLength & 0xff]);

    return new Uint8Array(Buffer.concat([lengthHeader, encryptedKey, iv, authTag, ciphertext]));
  }

  decryptWithPrivateKey(encryptedPayload: Uint8Array, privateKey: string): string {
    const buf = Buffer.from(encryptedPayload);
    if (buf.length < 2 + MessageCryptoService.IV_LENGTH + MessageCryptoService.TAG_LENGTH) {
      throw new Error('Payload cifrado demasiado corto');
    }

    const keyLength = (buf[0] << 8) | buf[1];
    let offset = 2;
    const encryptedKey = buf.subarray(offset, offset + keyLength);
    offset += keyLength;
    const iv = buf.subarray(offset, offset + MessageCryptoService.IV_LENGTH);
    offset += MessageCryptoService.IV_LENGTH;
    const authTag = buf.subarray(offset, offset + MessageCryptoService.TAG_LENGTH);
    offset += MessageCryptoService.TAG_LENGTH;
    const ciphertext = buf.subarray(offset);

    const aesKey = (QuickCrypto as any).privateDecrypt(
      {
        key: privateKey,
        padding: (QuickCrypto as any).constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      encryptedKey
    ) as Buffer;

    const decipher = (QuickCrypto as any).createDecipheriv('aes-256-gcm', aesKey, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]) as Buffer;

    return decrypted.toString('utf8');
  }
}

export const messageCryptoService = new MessageCryptoService();
