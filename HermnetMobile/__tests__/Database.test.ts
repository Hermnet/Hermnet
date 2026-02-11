import { databaseService } from "../services/DatabaseService";
import * as SQLite from 'expo-sqlite';

describe('DatabaseService', () => {
    it('should initialize database and create tables', async () => {
        await databaseService.initDB();
        const db = databaseService.getDatabase();

        expect(db?.execAsync).toHaveBeenCalledWith(
            expect.stringContaining('CREATE TABLE IF NOT EXISTS key_store')
        );
        expect(db?.execAsync).toHaveBeenCalledWith(
            expect.stringContaining('CREATE TABLE IF NOT EXISTS contacts_vault')
        );
    })
})