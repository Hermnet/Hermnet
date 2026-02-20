import { MessageFlowService } from '../services/MessageFlowService';
import { messageApiService } from '../services/MessageApiService';
import { databaseService } from '../services/DatabaseService';
import { messageCryptoService } from '../services/MessageCryptoService';
import { steganographyService } from '../services/SteganographyService';

jest.mock('../services/MessageApiService', () => ({
  messageApiService: {
    sendMessage: jest.fn(),
    getMessages: jest.fn(),
  },
}));

jest.mock('../services/DatabaseService', () => ({
  databaseService: {
    getContactPublicKey: jest.fn(),
    saveMessageHistory: jest.fn(),
  },
}));

describe('MessageFlowService', () => {
  const senderService = new MessageFlowService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should execute outbox pipeline and post stego packet', async () => {
    const recipientIdentity = {
      publicKey: 'recipient-public-key',
    };

    const encryptedPayload = new Uint8Array([1, 2, 3, 4]);
    const stegoPacket = new Uint8ClampedArray(64 * 64 * 4);

    jest.spyOn(databaseService, 'getContactPublicKey').mockResolvedValue(recipientIdentity.publicKey);
    jest.spyOn(messageCryptoService, 'encryptForRecipient').mockReturnValue(encryptedPayload);
    jest.spyOn(steganographyService, 'embedPayload').mockReturnValue(stegoPacket);

    await senderService.sendMessage({
      recipientId: 'HNET-RECIPIENT',
      plaintext: 'hello world',
    });

    expect(messageCryptoService.encryptForRecipient).toHaveBeenCalledWith('hello world', recipientIdentity.publicKey);
    expect(steganographyService.embedPayload).toHaveBeenCalled();
    expect(messageApiService.sendMessage).toHaveBeenCalledWith('HNET-RECIPIENT', stegoPacket);
    expect(databaseService.saveMessageHistory).toHaveBeenCalledWith(encryptedPayload, 'SENT');
  });

  it('should execute inbox pipeline and persist decrypted messages', async () => {
    const packet = new Uint8Array(256);
    const encryptedPayload = new Uint8Array([9, 8, 7, 6]);

    jest.spyOn(messageApiService, 'getMessages').mockResolvedValue([packet]);
    jest.spyOn(steganographyService, 'extractPayload').mockReturnValue(encryptedPayload);
    jest.spyOn(messageCryptoService, 'decryptWithPrivateKey').mockReturnValue('decrypted-text');

    const messages = await senderService.syncInbox('HNET-ME', 'private-key');

    expect(messageApiService.getMessages).toHaveBeenCalledWith('HNET-ME');
    expect(steganographyService.extractPayload).toHaveBeenCalled();
    expect(messageCryptoService.decryptWithPrivateKey).toHaveBeenCalledWith(encryptedPayload, 'private-key');
    expect(databaseService.saveMessageHistory).toHaveBeenCalled();
    expect(messages).toEqual(['decrypted-text']);
  });

  it('should fail sending when recipient key is missing', async () => {
    jest.spyOn(databaseService, 'getContactPublicKey').mockResolvedValue(null);

    await expect(
      senderService.sendMessage({
        recipientId: 'HNET-UNKNOWN',
        plaintext: 'text',
      })
    ).rejects.toThrow('Recipient public key not found');
  });
});
