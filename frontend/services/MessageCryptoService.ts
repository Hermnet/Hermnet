import QuickCrypto from './CryptoService';
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
  /**
   * Tamaño del bloque de padding. Cualquier mensaje se rellena hasta el siguiente
   * múltiplo de 256 bytes antes de cifrar. Esto evita que un observador de la
   * red infiera la longitud del mensaje a partir del tamaño del paquete cifrado.
   * Formato del plaintext rellenado:
   *   [4 bytes BE: longitud real del JSON][JSON utf-8][padding 0x00 hasta múltiplo de 256]
   */
  private static readonly PAD_BLOCK = 256;

  private padPlaintext(plaintext: string): Buffer {
    const data = Buffer.from(plaintext, 'utf8');
    const headerLen = 4;
    const totalUnpadded = headerLen + data.length;
    const padded = Math.ceil(totalUnpadded / MessageCryptoService.PAD_BLOCK) * MessageCryptoService.PAD_BLOCK;
    const buf = Buffer.alloc(padded);
    buf.writeUInt32BE(data.length, 0);
    data.copy(buf, headerLen);
    // El resto queda en 0x00, que es el padding.
    return buf;
  }

  private unpadPlaintext(padded: Buffer): string {
    if (padded.length < 4) throw new Error('Padding inválido: payload demasiado corto');
    const realLen = padded.readUInt32BE(0);
    if (realLen > padded.length - 4) throw new Error('Padding inválido: longitud declarada excede el payload');
    return Buffer.from(padded.subarray(4, 4 + realLen)).toString('utf8');
  }

  encryptForRecipient(plaintext: string, recipientPublicKey: string): Uint8Array {
    const aesKey = (QuickCrypto as any).randomBytes(MessageCryptoService.AES_KEY_LENGTH) as Buffer;
    const iv = (QuickCrypto as any).randomBytes(MessageCryptoService.IV_LENGTH) as Buffer;

    const padded = this.padPlaintext(plaintext);
    const cipher = (QuickCrypto as any).createCipheriv('aes-256-gcm', aesKey, iv);
    const ciphertext = Buffer.concat([
      cipher.update(padded),
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
    // QuickCrypto puede devolver Uint8Array en vez de Buffer real.
    // Buffer.from() garantiza un Buffer con .toString('utf8') correcto;
    // sin él, Uint8Array.toString() ignora el encoding y devuelve bytes
    // separados por comas → rompe JSON.parse.
    const decrypted = Buffer.from(Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]));

    // Compat hacia atrás: detectamos si el plaintext lleva el header de padding
    // (4 bytes BE con longitud razonable + resto consistente). Si no, asumimos
    // formato legado y devolvemos los bytes tal cual.
    if (decrypted.length >= 4) {
      const declaredLen = decrypted.readUInt32BE(0);
      if (declaredLen <= decrypted.length - 4 && declaredLen > 0) {
        try {
          return this.unpadPlaintext(decrypted);
        } catch {
          // No era padding válido — retrocedemos al formato legado.
        }
      }
    }
    return decrypted.toString('utf8');
  }
}

export const messageCryptoService = new MessageCryptoService();
