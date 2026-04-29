import QuickCrypto from 'react-native-quick-crypto';
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

const PEM_PUBLIC_KEY_RE = /^-----BEGIN PUBLIC KEY-----[\s\S]+-----END PUBLIC KEY-----\s*$/;

/**
 * Replica el cálculo de IdentityService.generateIdentity: HNET- + primeros 16 chars del
 * SHA-256(pk) en hex en mayúsculas. Si el id del QR no coincide con este fingerprint,
 * el QR está manipulado (alguien intenta suplantar otro HNET-ID con su propia clave).
 */
function fingerprintFromPublicKey(publicKey: string): string {
    const hash = QuickCrypto
        .createHash('sha256')
        .update(publicKey)
        .digest('hex' as any)
        .toString();
    return 'HNET-' + hash.substring(0, 16).toUpperCase();
}

type ContactsListener = () => void;

export class ContactsService {
    private listeners = new Set<ContactsListener>();

    /** Subscribe to changes (alta, edición de alias). Devuelve un unsubscribe. */
    subscribe(listener: ContactsListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private emit(): void {
        for (const l of this.listeners) {
            try { l(); } catch { /* aislar listeners */ }
        }
    }

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
        this.emit();
    }

    /** Elimina contacto e historial de mensajes asociado en una sola operación. */
    async deleteContact(contactHash: string): Promise<void> {
        await databaseService.deleteMessagesByContact(contactHash);
        await databaseService.deleteContact(contactHash);
        this.emit();
    }

    /** Limpia solo los mensajes con el contacto, conservándolo en la lista. */
    async clearChatHistory(contactHash: string): Promise<void> {
        await databaseService.deleteMessagesByContact(contactHash);
        this.emit();
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
        if (!PEM_PUBLIC_KEY_RE.test(payload.publicKey)) {
            throw new Error('QR inválido: la clave pública no tiene formato PEM');
        }
        // Anti-spoofing: el HNET-id es el fingerprint SHA-256 de la pk.
        // Si no cuadra, alguien ha manipulado el QR para asociar su pk a otro id.
        const expectedId = fingerprintFromPublicKey(payload.publicKey);
        if (expectedId !== payload.id) {
            throw new Error('QR inválido: la clave pública no corresponde al ID');
        }

        await this.saveContact(payload.id, payload.publicKey, alias);
        return { contactHash: payload.id, publicKey: payload.publicKey, alias: alias ?? null };
    }
}

export const contactsService = new ContactsService();
