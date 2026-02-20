import { apiClient } from './ApiClient';

interface SendMessageRequestDto {
  recipientId: string;
  stegoImage: number[];
}

/**
 * API adapter for secure message transport endpoints.
 */
export class MessageApiService {
  /**
   * Sends a steganographic packet to a recipient mailbox.
   */
  async sendMessage(recipientId: string, stegoImage: Uint8Array | Uint8ClampedArray): Promise<void> {
    const payload: SendMessageRequestDto = {
      recipientId,
      stegoImage: Array.from(stegoImage),
    };

    await apiClient.request<void>({
      path: '/api/messages',
      method: 'POST',
      body: payload,
    });
  }

  /**
   * Retrieves steganographic packets for the provided user identifier.
   */
  async getMessages(myId: string): Promise<Uint8Array[]> {
    const response = await apiClient.request<unknown>({
      path: `/api/messages?myId=${encodeURIComponent(myId)}`,
      method: 'GET',
    });

    if (!Array.isArray(response)) {
      throw new Error('Invalid /api/messages response format');
    }

    return response.map((item) => this.decodePacket(item));
  }

  private decodePacket(packet: unknown): Uint8Array {
    if (Array.isArray(packet)) {
      return new Uint8Array(packet as number[]);
    }

    if (typeof packet === 'string') {
      const binary = atob(packet);
      const bytes = new Uint8Array(binary.length);

      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      return bytes;
    }

    throw new Error('Invalid stego packet format in /api/messages response');
  }
}

export const messageApiService = new MessageApiService();
