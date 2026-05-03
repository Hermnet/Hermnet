import QuickCrypto from 'react-native-quick-crypto';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { authSessionService } from './AuthSessionService';
import { databaseService } from './DatabaseService';
import { Identity } from './IdentityService';

/* ─────────────────────────────────────────────
   Constantes criptográficas
   ───────────────────────────────────────────── */
const PBKDF2_ITERATIONS = 100_000;
const KEY_LENGTH = 32; // AES-256
const SALT_LENGTH = 16;
const IV_LENGTH = 12; // AES-GCM
const TAG_LENGTH = 16; // GCM auth tag

/** Versión del formato del archivo .hnet (para migraciones futuras). */
const FORMAT_VERSION = 1;

/* ─────────────────────────────────────────────
   Tipos internos
   ───────────────────────────────────────────── */
interface BackupPayload {
  version: number;
  identity: Identity;
  contacts: Array<{
    contact_hash: string;
    public_key: string;
    alias_local: string | null;
  }>;
  messages: Array<{
    contact_hash: string;
    plaintext: string;
    is_mine: boolean;
    created_at: number;
  }>;
}

export interface ExportResult {
  fileUri: string;
  fileName: string;
}

/* ─────────────────────────────────────────────
   Helpers criptográficos
   ───────────────────────────────────────────── */

/** Deriva una clave AES-256 a partir de la contraseña y un salt con PBKDF2. */
function deriveKey(password: string, salt: Uint8Array): Buffer {
  return QuickCrypto.pbkdf2Sync(
    password,
    salt as any,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    'sha256',
  ) as any;
}

/** Cifra un buffer con AES-256-GCM. Devuelve salt + iv + tag + ciphertext. */
function encrypt(plainBuf: Buffer, password: string): Buffer {
  const salt = QuickCrypto.randomBytes(SALT_LENGTH);
  const iv = QuickCrypto.randomBytes(IV_LENGTH);
  const key = deriveKey(password, salt);

  const cipher = (QuickCrypto as any).createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainBuf),
    cipher.final(),
  ]);
  const tag: Buffer = cipher.getAuthTag();

  // Formato binario: [salt 16B][iv 12B][tag 16B][ciphertext ...]
  return Buffer.concat([salt as any, iv as any, tag, encrypted]);
}

/** Descifra un blob producido por encrypt(). Lanza si la contraseña es incorrecta. */
function decrypt(blob: Buffer, password: string): Buffer {
  const salt = blob.subarray(0, SALT_LENGTH);
  const iv = blob.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = blob.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const ciphertext = blob.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  const key = deriveKey(password, salt);
  const decipher = (QuickCrypto as any).createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted;
}

/* ─────────────────────────────────────────────
   Servicio público
   ───────────────────────────────────────────── */

export class RecoveryService {
  /**
   * Exporta la identidad, contactos y mensajes a un archivo .hnet cifrado.
   *
   * Flujo:
   *  1. Recopila identidad (SecureStore) + contactos + mensajes (SQLite).
   *  2. Serializa a JSON.
   *  3. Deriva clave PBKDF2 de la contraseña del usuario.
   *  4. Cifra con AES-256-GCM.
   *  5. Escribe archivo .hnet en el directorio de cache de la app.
   *  6. Comparte el archivo para que el usuario lo guarde donde quiera.
   */
  async exportBackup(password: string): Promise<ExportResult> {
    // 1. Recopilar datos
    const identity = await authSessionService.getIdentity();
    if (!identity) throw new Error('No hay identidad almacenada para exportar.');

    const contacts = await databaseService.getAllContactsRaw();

    // Obtener TODOS los mensajes de cada contacto
    const allMessages: BackupPayload['messages'] = [];
    for (const c of contacts) {
      let beforeId: number | undefined;
      let batch;
      do {
        batch = await databaseService.getMessagesByContact(c.contact_hash, {
          limit: 500,
          beforeMsgId: beforeId,
        });
        for (const m of batch) {
          allMessages.push({
            contact_hash: c.contact_hash,
            plaintext: m.text,
            is_mine: m.isMine,
            created_at: m.createdAt,
          });
        }
        if (batch.length > 0) {
          beforeId = Number(batch[batch.length - 1].id);
        }
      } while (batch.length === 500);
    }

    const payload: BackupPayload = {
      version: FORMAT_VERSION,
      identity,
      contacts,
      messages: allMessages,
    };

    // 2-4. Serializar + cifrar
    const jsonStr = JSON.stringify(payload);
    const plainBuf = Buffer.from(jsonStr, 'utf-8');
    const encryptedBuf = encrypt(plainBuf, password);

    // 5. Escribir archivo con la nueva API de expo-file-system
    const fileName = `hermnet-backup-${Date.now()}.hnet`;
    const file = new File(Paths.cache, fileName);
    const base64Data = encryptedBuf.toString('base64');
    file.write(base64Data, { encoding: 'base64' });

    // 6. Compartir
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/octet-stream',
        dialogTitle: 'Guardar respaldo Hermnet',
        UTI: 'public.data',
      });
    }

    return { fileUri: file.uri, fileName };
  }

  /**
   * Abre el selector de archivos y devuelve la URI del .hnet seleccionado.
   * Devuelve null si el usuario cancela.
   */
  async pickBackupFile(): Promise<string | null> {
    try {
      const result = await File.pickFileAsync();
      if (!result) return null;
      // pickFileAsync puede devolver un File o un array de File
      const picked = Array.isArray(result) ? result[0] : result;
      return picked?.uri ?? null;
    } catch {
      // El usuario canceló o hubo un error
      return null;
    }
  }

  /**
   * Importa un archivo .hnet: descifra, parsea y restaura identidad, contactos y mensajes.
   *
   * @returns La identidad restaurada.
   */
  async importBackup(fileUri: string, password: string): Promise<Identity> {
    // 1. Leer archivo
    const file = new File(fileUri);
    const base64Content = await file.base64();
    const encryptedBuf = Buffer.from(base64Content, 'base64');

    // 2. Descifrar (lanzará si la contraseña es incorrecta)
    let decryptedBuf: Buffer;
    try {
      decryptedBuf = decrypt(encryptedBuf, password);
    } catch {
      throw new Error('Contraseña incorrecta o archivo corrupto.');
    }

    // 3. Parsear
    let payload: BackupPayload;
    try {
      payload = JSON.parse(decryptedBuf.toString('utf-8'));
    } catch {
      throw new Error('El archivo no contiene datos válidos de Hermnet.');
    }

    if (!payload.version || !payload.identity?.id || !payload.identity?.publicKey || !payload.identity?.privateKey) {
      throw new Error('Formato de respaldo inválido.');
    }

    // 4. Restaurar identidad en SecureStore
    await authSessionService.setIdentity(payload.identity);

    // 5. Restaurar contactos
    for (const c of payload.contacts ?? []) {
      await databaseService.upsertContact(c.contact_hash, c.public_key, c.alias_local);
    }

    // 6. Restaurar mensajes
    for (const m of payload.messages ?? []) {
      await databaseService.saveDecryptedMessage(
        m.contact_hash,
        m.plaintext,
        m.is_mine,
        m.created_at,
      );
    }

    return payload.identity;
  }
}

export const recoveryService = new RecoveryService();
