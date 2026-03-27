import { databaseService } from './DatabaseService';

export interface Contact {
    contactHash: string;
    publicKey: string;
    alias: string | null;
}

class ContactsService {
    async getAllContacts(): Promise<Contact[]> {
        const db = databaseService.getDatabase();
        if (!db) return [];
        const rows = await (db as any).getAllAsync(
            'SELECT contact_hash, public_key, alias_local FROM contacts_vault;'
        );
        return (rows ?? []).map((r: any) => ({
            contactHash: r.contact_hash,
            publicKey: r.public_key,
            alias: r.alias_local ?? null,
        }));
    }
}

export const contactsService = new ContactsService();
