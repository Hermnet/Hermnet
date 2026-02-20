import * as SQLite from 'expo-sqlite';

export type MessageStatus = 'PENDING' | 'SENT' | 'DELIVERED';

export class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  /**
   * Initializes the database connection and creates necessary tables if they don't exist.
   */
  async initDB() {
    // Open the database (creates it if it doesn't exist)
    this.db = await SQLite.openDatabaseAsync('hermnet.db');

    // Execute table creation queries aligned with the technical documentation.
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
        content_encrypted BLOB NOT NULL,
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
  }

  /**
   * Retrieves the database instance.
   * @returns {SQLite.SQLiteDatabase | null} The database instance.
   */
  getDatabase() {
    return this.db;
  }

  /**
   * Returns the public key for a contact hash from the local vault.
   * @param contactHash Recipient/user hash.
   */
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

  /**
   * Stores a message record in local history.
   * @param content Message payload bytes.
   * @param status Delivery status.
   */
  async saveMessageHistory(content: Uint8Array, status: MessageStatus): Promise<void> {
    const database = this.requireDatabase();
    await (database as any).runAsync(
      'INSERT INTO messages_history (content_encrypted, status) VALUES (?, ?);',
      [content, status]
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
