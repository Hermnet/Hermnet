import * as SQLite from 'expo-sqlite';

export class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  /**
   * Initializes the database connection and creates necessary tables if they don't exist.
   */
  async initDB() {
    // Open the database (creates it if it doesn't exist)
    this.db = await SQLite.openDatabaseAsync('hermnet.db');

    // Execute table creation queries
    await this.db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS key_store (
        id INTEGER PRIMARY KEY NOT NULL,
        key_alias TEXT UNIQUE,
        encrypted_key TEXT
      );
      CREATE TABLE IF NOT EXISTS contacts_vault (
        id INTEGER PRIMARY KEY NOT NULL,
        name TEXT,
        public_key TEXT UNIQUE
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