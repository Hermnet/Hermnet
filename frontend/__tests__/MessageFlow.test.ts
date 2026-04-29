import { MessageFlowService } from '../services/MessageFlowService';
import { messageApiService } from '../services/MessageApiService';
import { databaseService } from '../services/DatabaseService';
import { messageCryptoService } from '../services/MessageCryptoService';
import { authSessionService } from '../services/AuthSessionService';

jest.mock('../services/MessageApiService', () => ({
  messageApiService: {
    sendMessage: jest.fn(),
    getMessages: jest.fn(),
    ackMessages: jest.fn(),
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

jest.mock('../services/ContactsService', () => ({
  contactsService: {
    saveContact: jest.fn(),
  },
}));

describe('MessageFlowService', () => {
  const senderService = new MessageFlowService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('encrypts message with envelope containing sender id, pk and timestamp', async () => {
    (authSessionService.getIdentity as jest.Mock).mockResolvedValue({
      id: 'HNET-SENDER123',
      publicKey: 'sender-public-key-pem',
    });
    (databaseService.getContactPublicKey as jest.Mock).mockResolvedValue('recipient-public-key');
    const encryptSpy = jest.spyOn(messageCryptoService, 'encryptForRecipient')
      .mockReturnValue(new Uint8Array([1, 2, 3, 4]));
    (messageApiService.sendMessage as jest.Mock).mockResolvedValue(undefined);

    await senderService.sendMessage({
      recipientId: 'HNET-RECIPIENT',
      plaintext: 'hello world',
      sentAt: 1000,
    });

    expect(encryptSpy).toHaveBeenCalledWith(
      JSON.stringify({ from: 'HNET-SENDER123', pk: 'sender-public-key-pem', text: 'hello world', ts: 1000 }),
      'recipient-public-key'
    );
    expect(messageApiService.sendMessage).toHaveBeenCalledWith(
      'HNET-RECIPIENT',
      expect.any(Uint8Array)
    );
    expect(databaseService.saveDecryptedMessage).toHaveBeenCalledWith(
      'HNET-RECIPIENT', 'hello world', true, 1000
    );

    encryptSpy.mockRestore();
  });

  it('fails sending when recipient public key is missing', async () => {
    (databaseService.getContactPublicKey as jest.Mock).mockResolvedValue(null);
    (authSessionService.getIdentity as jest.Mock).mockResolvedValue({
      id: 'HNET-SENDER',
      publicKey: 'pk',
    });

    await expect(
      senderService.sendMessage({ recipientId: 'HNET-UNKNOWN', plaintext: 'text' })
    ).rejects.toThrow('Recipient public key not found');
  });

  it('extracts sender id from envelope and saves message under correct contactHash', async () => {
    const packet = new Uint8Array(256);
    const envelope = JSON.stringify({ from: 'HNET-SENDER123', text: 'hola', ts: 5000 });

    (messageApiService.getMessages as jest.Mock).mockResolvedValue([packet]);
    (messageApiService.ackMessages as jest.Mock).mockResolvedValue(undefined);
    const decryptSpy = jest.spyOn(messageCryptoService, 'decryptWithPrivateKey').mockReturnValue(envelope);

    const result = await senderService.syncInbox('HNET-ME', 'private-key');

    expect(databaseService.saveDecryptedMessage).toHaveBeenCalledWith(
      'HNET-SENDER123', 'hola', false, 5000
    );
    expect(result.senders).toContain('HNET-SENDER123');
    expect(result.newContacts).toEqual([]);

    decryptSpy.mockRestore();
  });

  it('discards payloads without a recognisable envelope', async () => {
    (messageApiService.getMessages as jest.Mock).mockResolvedValue([new Uint8Array(64)]);
    (messageApiService.ackMessages as jest.Mock).mockResolvedValue(undefined);
    const decryptSpy = jest.spyOn(messageCryptoService, 'decryptWithPrivateKey')
      .mockReturnValue('plain text without JSON envelope');

    const result = await senderService.syncInbox('HNET-ME', 'private-key');

    expect(databaseService.saveDecryptedMessage).not.toHaveBeenCalled();
    expect(result.senders).toEqual([]);

    decryptSpy.mockRestore();
  });
});
