import { MessageFlowService } from '../services/MessageFlowService';
import { messageApiService } from '../services/MessageApiService';
import { databaseService } from '../services/DatabaseService';
import { messageCryptoService } from '../services/MessageCryptoService';
import { steganographyService } from '../services/SteganographyService';
import { authSessionService } from '../services/AuthSessionService';

jest.mock('../services/MessageApiService', () => ({
  messageApiService: {
    sendMessage: jest.fn(),
    getMessages: jest.fn(),
  },
}));

jest.mock('../services/DatabaseService', () => ({
  databaseService: {
    getContactPublicKey: jest.fn(),
    saveDecryptedMessage: jest.fn(),
  },
}));

jest.mock('../services/AuthSessionService', () => ({
  authSessionService: {
    getIdentity: jest.fn(),
  },
}));

describe('MessageFlowService', () => {
  const senderService = new MessageFlowService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should encrypt message with JSON envelope containing sender ID', async () => {
    (authSessionService.getIdentity as jest.Mock).mockResolvedValue({ id: 'HNET-SENDER123' });
    jest.spyOn(databaseService, 'getContactPublicKey').mockResolvedValue('recipient-public-key');
    jest.spyOn(messageCryptoService, 'encryptForRecipient').mockReturnValue(new Uint8Array([1, 2, 3, 4]));
    jest.spyOn(steganographyService, 'embedPayload').mockReturnValue(new Uint8ClampedArray(64 * 64 * 4));

    await senderService.sendMessage({
      recipientId: 'HNET-RECIPIENT',
      plaintext: 'hello world',
    });

    expect(messageCryptoService.encryptForRecipient).toHaveBeenCalledWith(
      JSON.stringify({ from: 'HNET-SENDER123', text: 'hello world' }),
      'recipient-public-key'
    );
    expect(databaseService.saveDecryptedMessage).toHaveBeenCalledWith('HNET-RECIPIENT', 'hello world', true);
  });

  it('should extract sender ID from envelope and save message under correct contactHash', async () => {
    const packet = new Uint8Array(256);
    const encryptedPayload = new Uint8Array([9, 8, 7, 6]);
    const envelope = JSON.stringify({ from: 'HNET-SENDER123', text: 'hola' });

    jest.spyOn(messageApiService, 'getMessages').mockResolvedValue([packet]);
    jest.spyOn(steganographyService, 'extractPayload').mockReturnValue(encryptedPayload);
    jest.spyOn(messageCryptoService, 'decryptWithPrivateKey').mockReturnValue(envelope);

    const messages = await senderService.syncInbox('HNET-ME', 'private-key');

    expect(databaseService.saveDecryptedMessage).toHaveBeenCalledWith('HNET-SENDER123', 'hola', false);
    expect(messages).toEqual(['hola']);
  });

  it('should handle legacy plaintext payload (without envelope) gracefully', async () => {
    const packet = new Uint8Array(256);

    jest.spyOn(messageApiService, 'getMessages').mockResolvedValue([packet]);
    jest.spyOn(steganographyService, 'extractPayload').mockReturnValue(new Uint8Array([1]));
    jest.spyOn(messageCryptoService, 'decryptWithPrivateKey').mockReturnValue('plain text sin envoltorio');

    const messages = await senderService.syncInbox('HNET-ME', 'private-key');

    expect(databaseService.saveDecryptedMessage).toHaveBeenCalledWith('', 'plain text sin envoltorio', false);
    expect(messages).toEqual(['plain text sin envoltorio']);
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
