import { MessageApiService } from '../services/MessageApiService';
import { apiClient } from '../services/ApiClient';

jest.mock('../services/ApiClient', () => ({
  apiClient: {
    request: jest.fn(),
  },
}));

describe('MessageApiService', () => {
  const service = new MessageApiService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send stegoImage as Base64 string, not as number array', async () => {
      (apiClient.request as jest.Mock).mockResolvedValue(undefined);

      const stegoImage = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      await service.sendMessage('HNET-RECIPIENT123', stegoImage);

      expect(apiClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/messages',
          method: 'POST',
          body: {
            recipientId: 'HNET-RECIPIENT123',
            stegoImage: 'SGVsbG8=', // Base64 de [72, 101, 108, 108, 111]
          },
        })
      );
    });

    it('should also accept Uint8ClampedArray and encode it as Base64', async () => {
      (apiClient.request as jest.Mock).mockResolvedValue(undefined);

      const stegoImage = new Uint8ClampedArray([1, 2, 3, 4]);
      await service.sendMessage('HNET-RECIPIENT123', stegoImage);

      const call = (apiClient.request as jest.Mock).mock.calls[0][0];
      expect(typeof call.body.stegoImage).toBe('string');
      // Verify it decodes back correctly
      const decoded = Buffer.from(call.body.stegoImage, 'base64');
      expect(Array.from(decoded)).toEqual([1, 2, 3, 4]);
    });
  });

  describe('getMessages', () => {
    it('should decode Base64 packets returned by the backend', async () => {
      (apiClient.request as jest.Mock).mockResolvedValue(['SGVsbG8=', 'V29ybGQ=']);

      const result = await service.getMessages('HNET-ME');

      expect(result).toHaveLength(2);
      expect(Array.from(result[0])).toEqual([72, 101, 108, 108, 111]); // "Hello"
      expect(Array.from(result[1])).toEqual([87, 111, 114, 108, 100]); // "World"
    });

    it('should also handle number array packets (formato legado)', async () => {
      (apiClient.request as jest.Mock).mockResolvedValue([[10, 20, 30]]);

      const result = await service.getMessages('HNET-ME');

      expect(Array.from(result[0])).toEqual([10, 20, 30]);
    });

    it('should throw when the response is not an array', async () => {
      (apiClient.request as jest.Mock).mockResolvedValue(null);

      await expect(service.getMessages('HNET-ME')).rejects.toThrow(
        'Invalid /api/messages response format'
      );
    });

    it('should throw when a packet has an unexpected format', async () => {
      (apiClient.request as jest.Mock).mockResolvedValue([{ invalid: true }]);

      await expect(service.getMessages('HNET-ME')).rejects.toThrow(
        'Invalid stego packet format in /api/messages response'
      );
    });

    it('should send myId as query param', async () => {
      (apiClient.request as jest.Mock).mockResolvedValue([]);

      await service.getMessages('HNET-ABCDEF123456');

      expect(apiClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/messages?myId=HNET-ABCDEF123456',
          method: 'GET',
        })
      );
    });
  });
});
