import { databaseService } from './DatabaseService';

export interface Contact {
    contactHash: string;
    publicKey: string;
    alias: string | null;
}

/** Payload encoded inside the QR code shown to other users */
export interface QRPayload {
    id: string;
    publicKey: string;
}

export class ContactsService {
    async getAllContacts(): Promise<Contact[]> {
        const rows = await databaseService.getAllContactsRaw();
        return rows.map((r) => ({
            contactHash: r.contact_hash,
            publicKey: r.public_key,
            alias: r.alias_local ?? null,
        }));
    }

    async saveContact(contactHash: string, publicKey: string, alias?: string): Promise<void> {
        await databaseService.upsertContact(contactHash, publicKey, alias ?? null);
    }

    /** Parses the raw string from QR scanner and saves the contact. */
    async saveContactFromQR(rawData: string, alias?: string): Promise<Contact> {
        let payload: QRPayload;
        try {
            payload = JSON.parse(rawData) as QRPayload;
        } catch {
            throw new Error('QR inválido: no es un código Hermnet reconocible');
        }

        if (!payload.id || !payload.publicKey) {
            throw new Error('QR inválido: faltan campos id o publicKey');
        }
        if (!payload.id.startsWith('HNET-')) {
            throw new Error('QR inválido: formato de ID no reconocido');
        }

        await this.saveContact(payload.id, payload.publicKey, alias);
        return { contactHash: payload.id, publicKey: payload.publicKey, alias: alias ?? null };
    }
}

export const contactsService = new ContactsService();
