import * as SQLite from 'expo-sqlite';

export class DatabaseService {
    private db: SQLite.SQLiteDatabase | null = null;

    async initDB() {
        // Abrimos la base de datos (se crea si no existe)
        this.db = await SQLite.openDatabaseAsync('hermnet.db');

        // Ejecutamos las queries de creación de tablas
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

    getDatabase() {
        return this.db;
    }
}

export const databaseService = new DatabaseService();