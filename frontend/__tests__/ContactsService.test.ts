import { ContactsService } from '../services/ContactsService';
import { databaseService } from '../services/DatabaseService';
import { identityService } from '../services/IdentityService';

jest.mock('../services/DatabaseService', () => ({
    databaseService: {
        getAllContactsRaw: jest.fn(),
        upsertContact: jest.fn(),
    },
}));

describe('ContactsService', () => {
    const service = new ContactsService();

    beforeEach(() => {
        jest.clearAllMocks();
        (databaseService.getAllContactsRaw as jest.Mock).mockResolvedValue([]);
        (databaseService.upsertContact as jest.Mock).mockResolvedValue(undefined);
    });

    describe('getAllContacts', () => {
        it('should return mapped contacts from DB', async () => {
            (databaseService.getAllContactsRaw as jest.Mock).mockResolvedValue([
                { contact_hash: 'HNET-ABC123', public_key: 'pk1', alias_local: 'Alice', is_blocked: false, is_pinned: true, is_muted: false, is_archived: false, avatar_bg: '#111111', avatar_icon: '#ffffff' },
                { contact_hash: 'HNET-DEF456', public_key: 'pk2', alias_local: null, is_blocked: true, is_pinned: false, is_muted: true, is_archived: true, avatar_bg: null, avatar_icon: null },
            ]);

            const result = await service.getAllContacts();

            expect(result).toEqual([
                { contactHash: 'HNET-ABC123', publicKey: 'pk1', alias: 'Alice', isBlocked: false, isPinned: true, isMuted: false, isArchived: false, avatarBg: '#111111', avatarIcon: '#ffffff' },
                { contactHash: 'HNET-DEF456', publicKey: 'pk2', alias: null, isBlocked: true, isPinned: false, isMuted: true, isArchived: true, avatarBg: null, avatarIcon: null },
            ]);
        });

        it('should return empty array when there are no contacts', async () => {
            const result = await service.getAllContacts();

            expect(result).toEqual([]);
        });
    });

    describe('saveContact', () => {
        it('should upsert contact into contacts_vault', async () => {
            await service.saveContact('HNET-ABC123', 'pk1', 'Alice');

            expect(databaseService.upsertContact).toHaveBeenCalledWith('HNET-ABC123', 'pk1', 'Alice');
        });

        it('should use null as alias when not provided', async () => {
            await service.saveContact('HNET-ABC123', 'pk1');

            expect(databaseService.upsertContact).toHaveBeenCalledWith('HNET-ABC123', 'pk1', null);
        });

        it('should throw when database upsert fails', async () => {
            (databaseService.upsertContact as jest.Mock).mockRejectedValue(new Error('Database not initialised'));

            await expect(service.saveContact('HNET-ABC', 'pk')).rejects.toThrow('Database not initialised');
        });
    });

    describe('saveContactFromQR', () => {
        it('should parse valid QR payload and save contact', async () => {
            const identity = identityService.generateIdentity();
            const qrData = JSON.stringify({ id: identity.id, publicKey: identity.publicKey });

            const result = await service.saveContactFromQR(qrData, 'Bob');

            expect(databaseService.upsertContact).toHaveBeenCalledWith(identity.id, identity.publicKey, 'Bob');
            expect(result).toEqual({
                contactHash: identity.id,
                publicKey: identity.publicKey,
                alias: 'Bob',
                isBlocked: false,
                isPinned: false,
                isMuted: false,
                isArchived: false,
                avatarBg: null,
                avatarIcon: null,
            });
        });

        it('should throw on invalid JSON', async () => {
            await expect(service.saveContactFromQR('not-json')).rejects.toThrow('QR inválido');
        });

        it('should throw when QR is missing required fields', async () => {
            const qrData = JSON.stringify({ id: 'HNET-QR123' }); // missing publicKey

            await expect(service.saveContactFromQR(qrData)).rejects.toThrow('QR inválido');
        });
    });
});
