import { databaseService } from "../services/DatabaseService";
import * as SQLite from 'expo-sqlite';

describe('DatabaseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize database and create tables defined in technical documentation', async () => {
    await databaseService.initDB();
    const db = databaseService.getDatabase();

    expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith('hermnet.db');
    expect(db?.execAsync).toHaveBeenCalledTimes(1);

    const executedSql = (db?.execAsync as jest.Mock).mock.calls[0][0] as string;

    expect(executedSql).toContain('PRAGMA journal_mode = WAL;');
    expect(executedSql).toContain('CREATE TABLE IF NOT EXISTS key_store');
    expect(executedSql).toContain('encrypted_sk BLOB NOT NULL');
    expect(executedSql).toContain('auth_tag BLOB NOT NULL');
    expect(executedSql).toContain('id_hash TEXT UNIQUE');
    expect(executedSql).toContain('kdf_salt BLOB');
    expect(executedSql).toContain('iv BLOB');

    expect(executedSql).toContain('CREATE TABLE IF NOT EXISTS contacts_vault');
    expect(executedSql).toContain('contact_hash TEXT PRIMARY KEY NOT NULL');
    expect(executedSql).toContain('public_key TEXT NOT NULL UNIQUE');
    expect(executedSql).toContain('alias_local TEXT');

    expect(executedSql).toContain('CREATE TABLE IF NOT EXISTS messages_history');
    expect(executedSql).toContain('msg_id INTEGER PRIMARY KEY NOT NULL');
    expect(executedSql).toContain('content_encrypted BLOB NOT NULL');
    expect(executedSql).toContain("status TEXT NOT NULL CHECK (status IN ('PENDING', 'SENT', 'DELIVERED'))");

    expect(executedSql).toContain('CREATE TABLE IF NOT EXISTS sync_queue');
    expect(executedSql).toContain('task_id INTEGER PRIMARY KEY NOT NULL');
    expect(executedSql).toContain('task_type TEXT NOT NULL');
    expect(executedSql).toContain('task_payload BLOB NOT NULL');
    expect(executedSql).toContain('created_at INTEGER NOT NULL');

    expect(executedSql).toContain('CREATE TABLE IF NOT EXISTS cover_images');
    expect(executedSql).toContain('image_id INTEGER PRIMARY KEY NOT NULL');
    expect(executedSql).toContain('local_uri TEXT NOT NULL UNIQUE');
    expect(executedSql).toContain('checksum TEXT');
  });
});
