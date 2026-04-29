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
    it('should send payload as Base64 string, not as number array', async () => {
      (apiClient.request as jest.Mock).mockResolvedValue(undefined);

      const payload = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      await service.sendMessage('HNET-RECIPIENT123', payload);

      expect(apiClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/messages',
          method: 'POST',
          body: {
            recipientId: 'HNET-RECIPIENT123',
            payload: 'SGVsbG8=', // Base64 de [72, 101, 108, 108, 111]
          },
        })
      );
    });
  });

  describe('getMessages', () => {
    it('should decode Base64 payloads returned by the backend', async () => {
      (apiClient.request as jest.Mock).mockResolvedValue(['SGVsbG8=', 'V29ybGQ=']);

      const result = await service.getMessages('HNET-ME');

      expect(result).toHaveLength(2);
      expect(Array.from(result[0])).toEqual([72, 101, 108, 108, 111]); // "Hello"
      expect(Array.from(result[1])).toEqual([87, 111, 114, 108, 100]); // "World"
    });

    it('should also handle number array payloads (legacy format)', async () => {
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

    it('should throw when a payload has an unexpected format', async () => {
      (apiClient.request as jest.Mock).mockResolvedValue([{ invalid: true }]);

      await expect(service.getMessages('HNET-ME')).rejects.toThrow(
        'Invalid payload format in /api/messages response'
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
