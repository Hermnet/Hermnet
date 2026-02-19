import * as SQLite from 'expo-sqlite';

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
}

export const databaseService = new DatabaseService();
