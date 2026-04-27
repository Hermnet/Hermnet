import * as SQLite from 'expo-sqlite';

export type MessageStatus = 'PENDING' | 'SENT' | 'DELIVERED';

export class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async initDB(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.openAndPrepare();
    try {
      await this.initPromise;
    } catch (err) {
      this.initPromise = null;
      throw err;
    }
  }

  private async openAndPrepare(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync('hermnet.db');

    await this.db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS key_store (
        id INTEGER PRIMARY KEY NOT NULL,
        encrypted_sk BLOB NOT NULL,
        auth_tag BLOB NOT NULL,
        id_hash TEXT UNIQUE,
        kdf_salt BLOB,
        iv BLOB
      );
      CREATE TABLE IF NOT EXISTS contacts_vault (
        contact_hash TEXT PRIMARY KEY NOT NULL,
        public_key TEXT NOT NULL UNIQUE,
        alias_local TEXT
      );
      CREATE TABLE IF NOT EXISTS messages_history (
        msg_id INTEGER PRIMARY KEY NOT NULL,
        contact_hash TEXT NOT NULL DEFAULT '',
        plaintext TEXT NOT NULL DEFAULT '',
        is_mine INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL CHECK (status IN ('PENDING', 'SENT', 'DELIVERED'))
      );
      CREATE TABLE IF NOT EXISTS sync_queue (
        task_id INTEGER PRIMARY KEY NOT NULL,
        task_type TEXT NOT NULL,
        task_payload BLOB NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS cover_images (
        image_id INTEGER PRIMARY KEY NOT NULL,
        local_uri TEXT NOT NULL UNIQUE,
        checksum TEXT,
        created_at INTEGER NOT NULL
      );
    `);

    const migrations = [
      `ALTER TABLE messages_history ADD COLUMN contact_hash TEXT NOT NULL DEFAULT '';`,
      `ALTER TABLE messages_history ADD COLUMN plaintext TEXT NOT NULL DEFAULT '';`,
      `ALTER TABLE messages_history ADD COLUMN is_mine INTEGER NOT NULL DEFAULT 0;`,
      `ALTER TABLE messages_history ADD COLUMN created_at INTEGER NOT NULL DEFAULT 0;`,
      `ALTER TABLE messages_history ADD COLUMN is_read INTEGER NOT NULL DEFAULT 0;`,
    ];
    for (const sql of migrations) {
      await (this.db as any).runAsync(sql).catch(() => {});
    }
  }

  /**
   * Detecta si el handle nativo está colgado (típico tras Fast Refresh):
   * NullPointerException dentro del puente nativo.
   */
  private isStaleHandleError(err: unknown): boolean {
    const msg = (err as any)?.message ?? String(err);
    return /NullPointerException|prepareAsync|database is closed|NativeDatabase/i.test(msg);
  }

  /**
   * Garantiza un handle vivo y reintenta una vez si detecta que el nativo se ha colgado.
   */
  private async withDb<T>(op: (db: SQLite.SQLiteDatabase) => Promise<T>): Promise<T> {
    if (!this.db) await this.initDB();
    try {
      return await op(this.db!);
    } catch (err) {
      if (!this.isStaleHandleError(err)) throw err;
      console.warn('[DatabaseService] handle nativo caído, reabriendo BD…');
      this.db = null;
      this.initPromise = null;
      await this.initDB();
      return await op(this.db!);
    }
  }

  getDatabase() {
    return this.db;
  }

  async getContactPublicKey(contactHash: string): Promise<string | null> {
    return this.withDb(async (db) => {
      const row = await (db as any).getFirstAsync(
        'SELECT public_key FROM contacts_vault WHERE contact_hash = ? LIMIT 1;',
        [contactHash]
      );
      if (!row || typeof row.public_key !== 'string') return null;
      return row.public_key as string;
    });
  }

  async saveDecryptedMessage(contactHash: string, plaintext: string, isMine: boolean, createdAt?: number): Promise<void> {
    await this.withDb(async (db) => {
      await (db as any).runAsync(
        'INSERT INTO messages_history (contact_hash, plaintext, is_mine, created_at, status) VALUES (?, ?, ?, ?, ?);',
        [contactHash, plaintext, isMine ? 1 : 0, createdAt ?? Date.now(), isMine ? 'SENT' : 'DELIVERED']
      );
    });
  }

  async getMessagesByContact(contactHash: string): Promise<Array<{ id: string; text: string; isMine: boolean; createdAt: number }>> {
    return this.withDb(async (db) => {
      // ORDER BY created_at: como ambos lados usan el timestamp del emisor, el orden es idéntico
      // en ambos dispositivos. msg_id como tiebreaker para mensajes en el mismo milisegundo.
      const rows = await (db as any).getAllAsync(
        'SELECT msg_id, plaintext, is_mine, created_at FROM messages_history WHERE contact_hash = ? ORDER BY created_at DESC, msg_id DESC;',
        [contactHash]
      );
      return (rows ?? []).map((r: any) => ({
        id: String(r.msg_id),
        text: r.plaintext,
        isMine: r.is_mine === 1,
        createdAt: r.created_at ?? 0,
      }));
    });
  }

  async getUnreadCount(contactHash: string): Promise<number> {
    return this.withDb(async (db) => {
      const row = await (db as any).getFirstAsync(
        'SELECT COUNT(*) as cnt FROM messages_history WHERE contact_hash = ? AND is_mine = 0 AND is_read = 0;',
        [contactHash]
      );
      return row?.cnt ?? 0;
    });
  }

  async markAsRead(contactHash: string): Promise<void> {
    await this.withDb(async (db) => {
      await (db as any).runAsync(
        'UPDATE messages_history SET is_read = 1 WHERE contact_hash = ? AND is_mine = 0;',
        [contactHash]
      );
    });
  }

  async saveMessageHistory(content: Uint8Array, status: MessageStatus): Promise<void> {
    await this.withDb(async (db) => {
      await (db as any).runAsync(
        'INSERT INTO messages_history (contact_hash, plaintext, is_mine, created_at, status) VALUES (?, ?, ?, ?, ?);',
        ['', new TextDecoder().decode(content), 0, Date.now(), status]
      );
    });
  }

  async getAllContactsRaw(): Promise<Array<{ contact_hash: string; public_key: string; alias_local: string | null }>> {
    return this.withDb(async (db) => {
      const rows = await (db as any).getAllAsync(
        'SELECT contact_hash, public_key, alias_local FROM contacts_vault;'
      );
      return rows ?? [];
    });
  }

  async upsertContact(contactHash: string, publicKey: string, alias: string | null): Promise<void> {
    await this.withDb(async (db) => {
      await (db as any).runAsync(
        `INSERT INTO contacts_vault (contact_hash, public_key, alias_local)
         VALUES (?, ?, ?)
         ON CONFLICT(contact_hash) DO UPDATE SET public_key = excluded.public_key, alias_local = excluded.alias_local;`,
        [contactHash, publicKey, alias]
      );
    });
  }

  async clearAllData(): Promise<void> {
    await this.withDb(async (db) => {
      await (db as any).execAsync(`
        DELETE FROM contacts_vault;
        DELETE FROM messages_history;
        DELETE FROM key_store;
        DELETE FROM sync_queue;
        DELETE FROM cover_images;
      `);
    });
  }
}

export const databaseService = new DatabaseService();
