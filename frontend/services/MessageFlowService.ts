import { databaseService } from './DatabaseService';
import { messageApiService } from './MessageApiService';
import { messageCryptoService } from './MessageCryptoService';
import { steganographyService } from './SteganographyService';

export interface SendMessageInput {
  recipientId: string;
  plaintext: string;
  coverImageRgba?: Uint8ClampedArray;
}

/**
 * Orchestrates secure message flow for outbox and inbox pipelines.
 */
export class MessageFlowService {
  /**
   * Outbox pipeline:
   * plaintext -> encrypt -> steganography embed -> POST /api/messages
   */
  async sendMessage(input: SendMessageInput): Promise<void> {
    const recipientPublicKey = await databaseService.getContactPublicKey(input.recipientId);
    if (!recipientPublicKey) {
      throw new Error(`Recipient public key not found for ${input.recipientId}`);
    }

    const encryptedPayload = messageCryptoService.encryptForRecipient(input.plaintext, recipientPublicKey);

    const coverImage = input.coverImageRgba ?? this.createDefaultCoverImage();
    const stegoPacket = steganographyService.embedPayload(coverImage, encryptedPayload, {
      addNoisePadding: true,
    });

    await messageApiService.sendMessage(input.recipientId, stegoPacket);
    await databaseService.saveMessageHistory(encryptedPayload, 'SENT');
  }

  /**
   * Inbox pipeline:
   * GET /api/messages -> extract stego bytes -> decrypt -> save to SQLite
   */
  async syncInbox(myId: string, localPrivateKey: string): Promise<string[]> {
    const packets = await messageApiService.getMessages(myId);
    const plaintextMessages: string[] = [];

    for (const packet of packets) {
      const rgbaPacket = new Uint8ClampedArray(packet);
      const encryptedPayload = steganographyService.extractPayload(rgbaPacket);
      const plaintext = messageCryptoService.decryptWithPrivateKey(encryptedPayload, localPrivateKey);

      plaintextMessages.push(plaintext);
      await databaseService.saveMessageHistory(new TextEncoder().encode(plaintext), 'DELIVERED');
    }

    return plaintextMessages;
  }

  private createDefaultCoverImage(): Uint8ClampedArray {
    const width = 64;
    const height = 64;
    const rgba = new Uint8ClampedArray(width * height * 4);

    for (let i = 0; i < rgba.length; i += 4) {
      rgba[i] = 90;
      rgba[i + 1] = 130;
      rgba[i + 2] = 180;
      rgba[i + 3] = 255;
    }

    return rgba;
  }
}

export const messageFlowService = new MessageFlowService();
