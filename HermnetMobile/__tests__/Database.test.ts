import { databaseService } from "../services/DatabaseService";
import * as SQLite from 'expo-sqlite';

describe('DatabaseService', () => {
    // Verify that database initialization creates the expected tables
    it('should initialize database and create tables', async () => {
        await databaseService.initDB();
        const db = databaseService.getDatabase();

        // Check if key_store table creation query was executed
        expect(db?.execAsync).toHaveBeenCalledWith(
            expect.stringContaining('CREATE TABLE IF NOT EXISTS key_store')
        );
        // Check if contacts_vault table creation query was executed
        expect(db?.execAsync).toHaveBeenCalledWith(
            expect.stringContaining('CREATE TABLE IF NOT EXISTS contacts_vault')
        );
    })
})