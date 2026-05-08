import * as SecureStore from 'expo-secure-store';
import QuickCrypto from 'react-native-quick-crypto';
import { Buffer } from 'buffer';

/**
 * Cifra y descifra datos sensibles que se persisten en la BD local (SQLite).
 *
 * El DEK (Data Encryption Key) son 32 bytes aleatorios generados una sola vez
 * y guardados en SecureStore (Keychain iOS / Keystore Android), respaldado por
 * hardware en dispositivos modernos. SecureStore solo libera el secreto cuando
 * el dispositivo está desbloqueado, por lo que la BD queda protegida frente a
 * extracción del archivo SQLite tras pérdida o robo del móvil.
 *
 * Formato de wire para celdas cifradas (single-line, ASCII-safe):
 *   enc:v1.<base64(iv)>.<base64(authTag)>.<base64(ciphertext)>
 *
 * El prefijo `enc:v1.` permite distinguir filas migradas de filas legadas en
 * texto plano y deja vía libre para versiones futuras del esquema.
 */

const DEK_STORAGE_KEY = 'hermnet.data.dek';
const PREFIX = 'enc:v1.';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

class DataKeyService {
    private dek: Buffer | null = null;
    private loadPromise: Promise<Buffer> | null = null;

    /**
     * Garantiza que el DEK esté en memoria. Si no existe en SecureStore lo crea
     * en ese momento. Idempotente y seguro frente a llamadas concurrentes.
     */
    async ensureLoaded(): Promise<void> {
        if (this.dek) return;
        if (this.loadPromise) {
            await this.loadPromise;
            return;
        }
        this.loadPromise = this.load();
        try {
            this.dek = await this.loadPromise;
        } finally {
            this.loadPromise = null;
        }
    }

    private async load(): Promise<Buffer> {
        const existing = await SecureStore.getItemAsync(DEK_STORAGE_KEY, {
            keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
        });
        if (existing) {
            return Buffer.from(existing, 'base64');
        }
        const fresh = (QuickCrypto as any).randomBytes(KEY_LENGTH) as Buffer;
        await SecureStore.setItemAsync(DEK_STORAGE_KEY, fresh.toString('base64'), {
            keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
        });
        return fresh;
    }

    /** Borra el DEK de memoria. Llamar al ir a background si quieres lock estricto. */
    lock(): void {
        this.dek = null;
    }

    /**
     * Borra el DEK de memoria y de SecureStore. Solo invocar al eliminar la
     * cuenta — invalida toda la BD local cifrada.
     */
    async destroy(): Promise<void> {
        this.dek = null;
        await SecureStore.deleteItemAsync(DEK_STORAGE_KEY);
    }

    /** ¿La cadena viene con el prefijo de cifrado del servicio? */
    isEncrypted(value: string | null | undefined): boolean {
        return typeof value === 'string' && value.startsWith(PREFIX);
    }

    /**
     * Cifra una cadena UTF-8. Devuelve el wire format (string ASCII).
     * Si el plaintext es vacío, se devuelve la cadena vacía sin cifrar
     * (no hay nada que proteger y simplifica filtros SQL como `WHERE col = ''`).
     */
    encrypt(plaintext: string): string {
        if (!plaintext) return '';
        if (!this.dek) {
            throw new Error('DataKeyService: DEK no cargado. Llama a ensureLoaded() antes.');
        }
        const iv = (QuickCrypto as any).randomBytes(IV_LENGTH) as Buffer;
        const cipher = (QuickCrypto as any).createCipheriv('aes-256-gcm', this.dek, iv);
        const ct = Buffer.concat([
            cipher.update(Buffer.from(plaintext, 'utf8')),
            cipher.final(),
        ]) as Buffer;
        const tag = cipher.getAuthTag() as Buffer;
        return `${PREFIX}${iv.toString('base64')}.${tag.toString('base64')}.${ct.toString('base64')}`;
    }

    /**
     * Descifra un wire format. Si la cadena no tiene el prefijo asume que es
     * texto legado y la devuelve tal cual — esto permite leer filas previas a
     * la migración mientras se reescriben de forma incremental.
     */
    decrypt(value: string): string {
        if (!value) return '';
        if (!this.isEncrypted(value)) return value;
        if (!this.dek) {
            throw new Error('DataKeyService: DEK no cargado. Llama a ensureLoaded() antes.');
        }
        const body = value.slice(PREFIX.length);
        const parts = body.split('.');
        if (parts.length !== 3) {
            throw new Error('DataKeyService: payload cifrado mal formado');
        }
        const iv = Buffer.from(parts[0], 'base64');
        const tag = Buffer.from(parts[1], 'base64');
        const ct = Buffer.from(parts[2], 'base64');
        if (iv.length !== IV_LENGTH || tag.length !== TAG_LENGTH) {
            throw new Error('DataKeyService: longitudes de iv/tag inesperadas');
        }
        const decipher = (QuickCrypto as any).createDecipheriv('aes-256-gcm', this.dek, iv);
        decipher.setAuthTag(tag);
        const pt = Buffer.concat([
            decipher.update(ct),
            decipher.final(),
        ]) as Buffer;
        return pt.toString('utf8');
    }

    /** ¿El servicio está listo para cifrar/descifrar? */
    isReady(): boolean {
        return this.dek !== null;
    }
}

export const dataKeyService = new DataKeyService();
