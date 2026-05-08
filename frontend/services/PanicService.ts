import { databaseService } from './DatabaseService';
import { authSessionService } from './AuthSessionService';
import { dataKeyService } from './DataKeyService';
import { prefsService } from './PrefsService';

/**
 * Borra de manera incondicional todo el estado local de la app:
 *  - BD SQLite (mensajes, contactos, sync, contadores anti-replay).
 *  - Identidad y JWT en SecureStore (claves PEM, hashes de PIN, etc.).
 *  - DEK del cifrado at-rest, para que ningún resto pueda descifrarse.
 *  - Preferencias de usuario (incluyendo configuraciones de seguridad).
 *
 * Útil para:
 *  - Modo pánico: cuando el usuario introduce un PIN especial bajo coacción.
 *  - "Eliminar cuenta" desde ajustes.
 *  - Recuperación tras corrupción.
 *
 * NOTA: SQLite no sobrescribe físicamente el espacio liberado, así que para
 * un wipe forense completo habría que borrar el archivo de la BD desde
 * filesystem. En la práctica, sin la DEK los blobs cifrados son ilegibles.
 */
export const panicService = {
    async wipe(): Promise<void> {
        // Cada paso es independiente y no debe abortar el resto si falla.
        try { await databaseService.clearAllData(); } catch { /* nothing to recover */ }
        try { await authSessionService.clearAllIdentityData(); } catch { /* nothing to recover */ }
        try { await dataKeyService.destroy(); } catch { /* nothing to recover */ }
        try { await prefsService.clearAll(); } catch { /* nothing to recover */ }
    },
};
