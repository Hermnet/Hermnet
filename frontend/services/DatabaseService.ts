import * as SQLite from 'expo-sqlite';

export type MessageStatus = 'PENDING' | 'SENT' | 'DELIVERED';

export class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initDB() {
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

    // Migrations for existing installs
    const migrations = [
      `ALTER TABLE messages_history ADD COLUMN contact_hash TEXT NOT NULL DEFAULT '';`,
      `ALTER TABLE messages_history ADD COLUMN plaintext TEXT NOT NULL DEFAULT '';`,
      `ALTER TABLE messages_history ADD COLUMN is_mine INTEGER NOT NULL DEFAULT 0;`,
      `ALTER TABLE messages_history ADD COLUMN created_at INTEGER NOT NULL DEFAULT 0;`,
    ];
    for (const sql of migrations) {
      await (this.db as any).runAsync(sql).catch(() => {});
    }
  }

  getDatabase() {
    return this.db;
  }

  async getContactPublicKey(contactHash: string): Promise<string | null> {
    const database = this.requireDatabase();
    const row = await (database as any).getFirstAsync(
      'SELECT public_key FROM contacts_vault WHERE contact_hash = ? LIMIT 1;',
      [contactHash]
    );

    if (!row || typeof row.public_key !== 'string') {
      return null;
    }

    return row.public_key;
  }

  async saveDecryptedMessage(contactHash: string, plaintext: string, isMine: boolean): Promise<void> {
    const database = this.requireDatabase();
    await (database as any).runAsync(
      'INSERT INTO messages_history (contact_hash, plaintext, is_mine, created_at, status) VALUES (?, ?, ?, ?, ?);',
      [contactHash, plaintext, isMine ? 1 : 0, Date.now(), isMine ? 'SENT' : 'DELIVERED']
    );
  }

  async getMessagesByContact(contactHash: string): Promise<Array<{ id: string; text: string; isMine: boolean }>> {
    const db = this.getDatabase();
    if (!db) return [];
    const rows = await (db as any).getAllAsync(
      'SELECT msg_id, plaintext, is_mine FROM messages_history WHERE contact_hash = ? ORDER BY msg_id DESC;',
      [contactHash]
    );
    return (rows ?? []).map((r: any) => ({
      id: String(r.msg_id),
      text: r.plaintext,
      isMine: r.is_mine === 1,
    }));
  }

  async saveMessageHistory(content: Uint8Array, status: MessageStatus): Promise<void> {
    const database = this.requireDatabase();
    await (database as any).runAsync(
      'INSERT INTO messages_history (contact_hash, plaintext, is_mine, created_at, status) VALUES (?, ?, ?, ?, ?);',
      ['', new TextDecoder().decode(content), 0, Date.now(), status]
    );
  }

  private requireDatabase(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error('Database is not initialized. Call initDB() first.');
    }

    return this.db;
  }
}

export const databaseService = new DatabaseService();
