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
    getNextOutgoingSeq: jest.fn(async () => 1),
    markIncomingSeqIfNew: jest.fn(async () => true),
    isContactBlocked: jest.fn(async () => false),
    updateMessageStatus: jest.fn(async () => {}),
    enqueueOutgoing: jest.fn(async () => {}),
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

jest.mock('../services/IdentityService', () => ({
  identityService: {
    signNonce: jest.fn(() => 'mock-signature-base64'),
    verifySignature: jest.fn(() => true),
  },
}));

describe('MessageFlowService', () => {
  const senderService = new MessageFlowService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('encrypts message with envelope containing sender id, pk, timestamp and signature', async () => {
    (authSessionService.getIdentity as jest.Mock).mockResolvedValue({
      id: 'HNET-SENDER123',
      publicKey: 'sender-public-key-pem',
      privateKey: 'sender-private-key-pem',
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

    // El sobre cifrado debe incluir la firma RSA-SHA256 sobre los datos canónicos.
    expect(encryptSpy).toHaveBeenCalledWith(
      JSON.stringify({ from: 'HNET-SENDER123', pk: 'sender-public-key-pem', text: 'hello world', ts: 1000, seq: 1, sig: 'mock-signature-base64' }),
      'recipient-public-key'
    );
    expect(messageApiService.sendMessage).toHaveBeenCalledWith(
      'HNET-RECIPIENT',
      expect.any(Uint8Array)
    );
    expect(databaseService.saveDecryptedMessage).toHaveBeenCalledWith(
      'HNET-RECIPIENT', 'hello world', true, 1000, 'PENDING'
    );
    expect(databaseService.updateMessageStatus).toHaveBeenCalledWith(
      'HNET-RECIPIENT', 1000, 'SENT'
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

  it('rejects replayed messages whose seq was already seen', async () => {
    const packet = new Uint8Array(256);
    const envelope = JSON.stringify({
      from: 'HNET-SENDER123',
      pk: 'sender-public-key-pem',
      text: 'hola',
      ts: 5000,
      seq: 7,
      sig: 'mock-signature-base64',
    });
    // En el flujo de saveContact por descubrimiento de pk, se llama a getContactPublicKey
    // primero (para saber si ya conocemos al contacto). Devolvemos null para indicar
    // contacto nuevo; el fingerprint check lo hará fallar pero queremos que llegue antes
    // a la comprobación de replay.
    (databaseService.getContactPublicKey as jest.Mock).mockResolvedValue('sender-public-key-pem');

    (messageApiService.getMessages as jest.Mock).mockResolvedValue([packet]);
    (messageApiService.ackMessages as jest.Mock).mockResolvedValue(undefined);
    (databaseService.markIncomingSeqIfNew as jest.Mock).mockResolvedValueOnce(false);
    const decryptSpy = jest.spyOn(messageCryptoService, 'decryptWithPrivateKey').mockReturnValue(envelope);

    const result = await senderService.syncInbox('HNET-ME', 'private-key');

    expect(databaseService.markIncomingSeqIfNew).toHaveBeenCalledWith('HNET-SENDER123', 7);
    expect(databaseService.saveDecryptedMessage).not.toHaveBeenCalled();
    expect(result.senders).toEqual([]);

    decryptSpy.mockRestore();
  });
});
