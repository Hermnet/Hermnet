import QuickCrypto from 'react-native-quick-crypto';
import { Buffer } from 'buffer';

/**
 * Handles message payload encryption and decryption for mailbox transport.
 */
export class MessageCryptoService {
  /**
   * Encrypts plaintext using the recipient public key.
   */
  encryptForRecipient(plaintext: string, recipientPublicKey: string): Uint8Array {
    const encrypted = (QuickCrypto as any).publicEncrypt(
      {
        key: recipientPublicKey,
        padding: (QuickCrypto as any).constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(plaintext, 'utf8')
    ) as Buffer;

    return new Uint8Array(encrypted);
  }

  /**
   * Decrypts an encrypted payload using the local private key.
   */
  decryptWithPrivateKey(encryptedPayload: Uint8Array, privateKey: string): string {
    const decrypted = (QuickCrypto as any).privateDecrypt(
      {
        key: privateKey,
        padding: (QuickCrypto as any).constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(encryptedPayload)
    ) as Buffer;

    return Buffer.from(decrypted).toString('utf8');
  }
}

export const messageCryptoService = new MessageCryptoService();
