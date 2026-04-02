import { ContactsService } from '../services/ContactsService';
import { databaseService } from '../services/DatabaseService';

jest.mock('../services/DatabaseService', () => ({
    databaseService: {
        getDatabase: jest.fn(),
    },
}));

const mockDb = {
    getAllAsync: jest.fn(),
    runAsync: jest.fn().mockResolvedValue(undefined),
};

describe('ContactsService', () => {
    const service = new ContactsService();

    beforeEach(() => {
        jest.clearAllMocks();
        (databaseService.getDatabase as jest.Mock).mockReturnValue(mockDb);
    });

    describe('getAllContacts', () => {
        it('should return mapped contacts from DB', async () => {
            mockDb.getAllAsync.mockResolvedValue([
                { contact_hash: 'HNET-ABC123', public_key: 'pk1', alias_local: 'Alice' },
                { contact_hash: 'HNET-DEF456', public_key: 'pk2', alias_local: null },
            ]);

            const result = await service.getAllContacts();

            expect(result).toEqual([
                { contactHash: 'HNET-ABC123', publicKey: 'pk1', alias: 'Alice' },
                { contactHash: 'HNET-DEF456', publicKey: 'pk2', alias: null },
            ]);
        });

        it('should return empty array when DB is not initialised', async () => {
            (databaseService.getDatabase as jest.Mock).mockReturnValue(null);

            const result = await service.getAllContacts();

            expect(result).toEqual([]);
        });
    });

    describe('saveContact', () => {
        it('should upsert contact into contacts_vault', async () => {
            await service.saveContact('HNET-ABC123', 'pk1', 'Alice');

            expect(mockDb.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO contacts_vault'),
                ['HNET-ABC123', 'pk1', 'Alice']
            );
        });

        it('should use null as alias when not provided', async () => {
            await service.saveContact('HNET-ABC123', 'pk1');

            expect(mockDb.runAsync).toHaveBeenCalledWith(
                expect.any(String),
                ['HNET-ABC123', 'pk1', null]
            );
        });

        it('should throw when DB is not initialised', async () => {
            (databaseService.getDatabase as jest.Mock).mockReturnValue(null);

            await expect(service.saveContact('HNET-ABC', 'pk')).rejects.toThrow('Database not initialised');
        });
    });

    describe('saveContactFromQR', () => {
        it('should parse valid QR payload and save contact', async () => {
            const qrData = JSON.stringify({ id: 'HNET-QR123', publicKey: 'qr-public-key' });

            const result = await service.saveContactFromQR(qrData, 'Bob');

            expect(mockDb.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO contacts_vault'),
                ['HNET-QR123', 'qr-public-key', 'Bob']
            );
            expect(result).toEqual({ contactHash: 'HNET-QR123', publicKey: 'qr-public-key', alias: 'Bob' });
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
