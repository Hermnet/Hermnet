import { apiClient } from './ApiClient';
import { Buffer } from 'buffer';

interface SendMessageRequestDto {
  recipientId: string;
  payload: string;
}

/**
 * API adapter for the secure message transport endpoints. The payload is an opaque
 * encrypted blob (RSA-OAEP wrapped AES-256-GCM ciphertext) — the server never sees
 * its contents nor knows what shape it has.
 */
export class MessageApiService {
  /**
   * Sends an encrypted payload to a recipient mailbox.
   */
  async sendMessage(recipientId: string, payload: Uint8Array): Promise<void> {
    const body: SendMessageRequestDto = {
      recipientId,
      payload: Buffer.from(payload).toString('base64'),
    };

    await apiClient.request<void>({
      path: '/api/messages',
      method: 'POST',
      body,
    });
  }

  /**
   * Acknowledges (and deletes) the messages currently in the user's mailbox.
   * If `cutoff` is provided, only entries with `createdAt <= cutoff` are removed.
   */
  async ackMessages(cutoff?: string): Promise<void> {
    await apiClient.request<void>({
      path: '/api/messages/ack',
      method: 'POST',
      body: cutoff !== undefined ? { cutoff } : {},
    });
  }

  /**
   * Retrieves encrypted payloads addressed to the given user identifier.
   */
  async getMessages(myId: string): Promise<Uint8Array[]> {
    const response = await apiClient.request<unknown>({
      path: `/api/messages?myId=${encodeURIComponent(myId)}`,
      method: 'GET',
    });

    if (!Array.isArray(response)) {
      throw new Error('Invalid /api/messages response format');
    }

    return response.map((item) => this.decodePayload(item));
  }

  private decodePayload(payload: unknown): Uint8Array {
    if (Array.isArray(payload)) {
      return new Uint8Array(payload as number[]);
    }

    if (typeof payload === 'string') {
      const binary = atob(payload);
      const bytes = new Uint8Array(binary.length);

      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      return bytes;
    }

    throw new Error('Invalid payload format in /api/messages response');
  }
}

export const messageApiService = new MessageApiService();
