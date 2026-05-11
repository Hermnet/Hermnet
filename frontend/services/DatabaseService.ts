import * as SQLite from 'expo-sqlite';
import { dataKeyService } from './DataKeyService';

export type MessageStatus = 'PENDING' | 'SENT' | 'DELIVERED';

export class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async initDB(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.openAndPrepareWithRetry();
    try {
      await this.initPromise;
    } catch (err) {
      this.initPromise = null;
      throw err;
    }
  }

  private async openAndPrepareWithRetry(): Promise<void> {
    try {
      await this.openAndPrepare();
    } catch (err) {
      if (!this.isStaleHandleError(err)) throw err;
      console.warn('[DatabaseService] apertura SQLite falló por handle nativo, reintentando…');
      await this.closeCurrentHandle();
      await new Promise(resolve => setTimeout(resolve, 80));
      await this.openAndPrepare();
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
      CREATE TABLE IF NOT EXISTS outgoing_seq (
        contact_hash TEXT PRIMARY KEY NOT NULL,
        next_seq INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS replay_seen (
        contact_hash TEXT NOT NULL,
        seq INTEGER NOT NULL,
        received_at INTEGER NOT NULL,
        PRIMARY KEY (contact_hash, seq)
      );
      CREATE TABLE IF NOT EXISTS pending_ephemeral (
        contact_hash TEXT PRIMARY KEY NOT NULL,
        ttl INTEGER NOT NULL,
        received_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS groups_vault (
        group_id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        admin_id TEXT,
        only_admin_can_post INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS group_members (
        group_id TEXT NOT NULL,
        contact_hash TEXT NOT NULL,
        PRIMARY KEY (group_id, contact_hash)
      );
    `);

    // Limpieza de tablas obsoletas de versiones anteriores del esquema.
    await (this.db as any)
      .runAsync(`DROP TABLE IF EXISTS cover_images;`)
      .catch(() => {});
    const migrations = [
      `ALTER TABLE messages_history ADD COLUMN contact_hash TEXT NOT NULL DEFAULT '';`,
      `ALTER TABLE messages_history ADD COLUMN plaintext TEXT NOT NULL DEFAULT '';`,
      `ALTER TABLE messages_history ADD COLUMN is_mine INTEGER NOT NULL DEFAULT 0;`,
      `ALTER TABLE messages_history ADD COLUMN created_at INTEGER NOT NULL DEFAULT 0;`,
      `ALTER TABLE messages_history ADD COLUMN is_read INTEGER NOT NULL DEFAULT 0;`,
      `ALTER TABLE contacts_vault ADD COLUMN is_blocked INTEGER NOT NULL DEFAULT 0;`,
      // Mensajes temporales: TTL acordado por chat (NULL = off) y timestamp
      // de expiración por mensaje (NULL = no expira).
      `ALTER TABLE contacts_vault ADD COLUMN ephemeral_ttl INTEGER;`,
      `ALTER TABLE messages_history ADD COLUMN expires_at INTEGER;`,
      // Chat list features: pin, mute, archive
      `ALTER TABLE contacts_vault ADD COLUMN is_pinned INTEGER NOT NULL DEFAULT 0;`,
      `ALTER TABLE contacts_vault ADD COLUMN is_muted INTEGER NOT NULL DEFAULT 0;`,
      `ALTER TABLE contacts_vault ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0;`,
      // Avatar customization: background color and icon color per contact
      `ALTER TABLE contacts_vault ADD COLUMN avatar_bg TEXT;`,
      `ALTER TABLE contacts_vault ADD COLUMN avatar_icon TEXT;`,
      // Reply-to context: JSON string with { id, text, isMine } of the replied message
      `ALTER TABLE messages_history ADD COLUMN reply_to_json TEXT;`,
      // Secuencia del remitente para dedupe estable de mensajes entrantes.
      `ALTER TABLE messages_history ADD COLUMN transport_seq INTEGER;`,
      `ALTER TABLE messages_history ADD COLUMN sender_hash TEXT;`,
      `ALTER TABLE messages_history ADD COLUMN sender_name TEXT;`,
      `ALTER TABLE groups_vault ADD COLUMN description TEXT;`,
      `ALTER TABLE groups_vault ADD COLUMN admin_id TEXT;`,
      `ALTER TABLE groups_vault ADD COLUMN only_admin_can_post INTEGER NOT NULL DEFAULT 0;`,
    ];
    for (const sql of migrations) {
      await (this.db as any).runAsync(sql).catch(() => {});
    }

    // Limpieza: borra mensajes huérfanos sin contact_hash que pudieran haberse acumulado
    // por bugs anteriores en el pipeline de cifrado/descifrado.
    await (this.db as any)
      .runAsync(`DELETE FROM messages_history WHERE contact_hash = '' OR contact_hash IS NULL;`)
      .catch(() => {});

    // Cifrado at-rest de filas sensibles. La DEK vive en SecureStore (Keychain/Keystore)
    // y se carga al arranque; las celdas que no tienen el prefijo `enc:v1.` se asumen
    // legadas en plaintext y se reescriben cifradas la primera vez que la app arranca
    // tras el upgrade. La migración es idempotente.
    //
    // Si la DEK no se puede cargar (entorno de test sin mock de SecureStore/QuickCrypto,
    // o fallo transitorio de hardware), la BD sigue funcional pero las nuevas filas se
    // guardan sin cifrar — preferimos disponibilidad a rechazar todas las operaciones.
    try {
      await dataKeyService.ensureLoaded();
      await this.migrateEncryptAtRest();
    } catch (err) {
      console.warn('[DatabaseService] DEK no disponible, BD operará sin cifrado at-rest:', err);
    }
  }

  private async migrateEncryptAtRest(): Promise<void> {
    if (!this.db) return;
    const db = this.db as any;
    try {
      const legacyMessages = await db.getAllAsync(
        `SELECT msg_id, plaintext FROM messages_history WHERE plaintext != '' AND plaintext NOT LIKE 'enc:v1.%';`
      );
      for (const row of legacyMessages ?? []) {
        const wire = dataKeyService.encrypt(row.plaintext);
        await db.runAsync(`UPDATE messages_history SET plaintext = ? WHERE msg_id = ?;`, [wire, row.msg_id]);
      }

      const legacyContacts = await db.getAllAsync(
        `SELECT contact_hash, alias_local FROM contacts_vault WHERE alias_local IS NOT NULL AND alias_local != '' AND alias_local NOT LIKE 'enc:v1.%';`
      );
      for (const row of legacyContacts ?? []) {
        const wire = dataKeyService.encrypt(row.alias_local);
        await db.runAsync(`UPDATE contacts_vault SET alias_local = ? WHERE contact_hash = ?;`, [wire, row.contact_hash]);
      }
    } catch (err) {
      console.warn('[DatabaseService] migrateEncryptAtRest falló:', err);
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

  private async closeCurrentHandle(): Promise<void> {
    const current = this.db as any;
    this.db = null;
    this.initPromise = null;
    try {
      await current?.closeAsync?.();
    } catch {
      // El handle ya está roto; basta con soltar la referencia JS.
    }
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
      await this.closeCurrentHandle();
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

  async saveDecryptedMessage(
    contactHash: string,
    plaintext: string,
    isMine: boolean,
    createdAt?: number,
    status?: MessageStatus,
    replyTo?: { id: string; text: string; isMine: boolean } | null,
    transportSeq?: number,
    senderHash?: string | null,
    senderName?: string | null,
  ): Promise<void> {
    const ts = createdAt ?? Date.now();
    await this.withDb(async (db) => {
      // Dedupe contra reintentos / sync concurrentes. Para mensajes entrantes
      // preferimos el seq firmado del emisor; así dos mensajes enviados en el
      // mismo milisegundo no colisionan.
      if (!isMine && typeof transportSeq === 'number') {
        const existing = await (db as any).getFirstAsync(
          'SELECT msg_id FROM messages_history WHERE contact_hash = ? AND is_mine = 0 AND transport_seq = ? LIMIT 1;',
          [contactHash, transportSeq]
        );
        if (existing) return;
      }
      if (createdAt !== undefined && (isMine || typeof transportSeq !== 'number')) {
        const existing = await (db as any).getFirstAsync(
          'SELECT msg_id FROM messages_history WHERE contact_hash = ? AND created_at = ? AND is_mine = ? LIMIT 1;',
          [contactHash, ts, isMine ? 1 : 0]
        );
        if (existing) return;
      }
      // Modo temporal: si el contacto tiene TTL acordado, calculamos cuándo
      // expira y lo grabamos. Un worker periódico borra los expirados.
      const ttlRow = await (db as any).getFirstAsync(
        'SELECT ephemeral_ttl FROM contacts_vault WHERE contact_hash = ? LIMIT 1;',
        [contactHash]
      );
      const ttl = ttlRow?.ephemeral_ttl;
      const expiresAt = typeof ttl === 'number' && ttl > 0 ? ts + ttl * 1000 : null;

      const stored = dataKeyService.isReady() ? dataKeyService.encrypt(plaintext) : plaintext;
      const finalStatus = status ?? (isMine ? 'SENT' : 'DELIVERED');
      const replyJson = replyTo ? JSON.stringify(replyTo) : null;
      await (db as any).runAsync(
        'INSERT INTO messages_history (contact_hash, plaintext, is_mine, created_at, status, expires_at, reply_to_json, transport_seq, sender_hash, sender_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
        [contactHash, stored, isMine ? 1 : 0, ts, finalStatus, expiresAt, replyJson, transportSeq ?? null, senderHash ?? null, senderName ?? null]
      );
    });
  }

  /**
   * Actualiza el status de un mensaje propio identificado por (contacto, ts).
   * Usado por el flujo de envío para pasar de PENDING → SENT cuando el server
   * confirma la recepción.
   */
  async updateMessageStatus(contactHash: string, sentAt: number, status: MessageStatus): Promise<void> {
    await this.withDb(async (db) => {
      await (db as any).runAsync(
        'UPDATE messages_history SET status = ? WHERE contact_hash = ? AND created_at = ? AND is_mine = 1;',
        [status, contactHash, sentAt]
      );
    });
  }

  /**
   * Devuelve los mensajes más recientes del contacto, paginados.
   * @param contactHash hash del contacto
   * @param options.limit máximo a devolver (defecto 50)
   * @param options.beforeCursor si se indica, usa su msgId como cursor local.
   *                             El chat ordena por inserción local (msg_id DESC)
   *                             para que los mensajes no cambien de posición por
   *                             pequeñas diferencias de reloj entre dispositivos.
   */
  async getMessagesByContact(
    contactHash: string,
    options: { limit?: number; beforeMsgId?: number; beforeCursor?: { createdAt: number; msgId: number } } = {}
  ): Promise<Array<{ id: string; text: string; isMine: boolean; createdAt: number; isRead: boolean; status: 'pending' | 'sent' | 'failed'; replyTo?: { id: string; text: string; isMine: boolean } | null; senderHash?: string | null; senderName?: string | null }>> {
    const limit = options.limit ?? 50;
    return this.withDb(async (db) => {
      let sql = 'SELECT msg_id, plaintext, is_mine, created_at, is_read, status, reply_to_json, sender_hash, sender_name FROM messages_history WHERE contact_hash = ?';
      let params: Array<string | number> = [contactHash];
      if (options.beforeCursor) {
        sql += ' AND msg_id < ?';
        params.push(options.beforeCursor.msgId);
      } else if (options.beforeMsgId !== undefined) {
        sql += ' AND msg_id < ?';
        params.push(options.beforeMsgId);
      }
      sql += ' ORDER BY msg_id DESC LIMIT ?;';
      params.push(limit);
      const rows = await (db as any).getAllAsync(sql, params);
      return (rows ?? []).map((r: any) => {
        // Mapeamos el status almacenado (mayúsculas, schema legado) al modelo UI
        // (minúsculas). PENDING → 'pending' (icono reloj), todo lo demás → 'sent'.
        const dbStatus = String(r.status ?? '').toUpperCase();
        const uiStatus: 'pending' | 'sent' | 'failed' =
          dbStatus === 'PENDING' ? 'pending' : 'sent';
        let replyTo: { id: string; text: string; isMine: boolean } | null = null;
        if (r.reply_to_json) {
          try { replyTo = JSON.parse(r.reply_to_json); } catch { /* ignore malformed */ }
        }
        return {
          id: String(r.msg_id),
          text: this.safeDecrypt(r.plaintext),
          isMine: r.is_mine === 1,
          createdAt: r.created_at ?? 0,
          isRead: r.is_mine === 1 || r.is_read === 1,
          status: uiStatus,
          replyTo,
          senderHash: r.sender_hash ?? null,
          senderName: r.sender_name ?? null,
        };
      });
    });
  }

  /**
   * Descifra una celda con manejo defensivo: si la DEK no está cargada o el
   * payload no es un wire reconocible, devuelve el valor tal cual. Evita que
   * un único registro corrupto rompa la lectura del histórico entero.
   */
  private safeDecrypt(value: string | null | undefined): string {
    if (value == null) return '';
    if (!dataKeyService.isReady()) return value;
    try {
      return dataKeyService.decrypt(value);
    } catch (err) {
      console.warn('[DatabaseService] decrypt fallido en celda, devolviendo raw:', err);
      return value;
    }
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
      // Sólo hacemos UPDATE si efectivamente hay mensajes no leídos. En polling 2s
      // un UPDATE constantemente sin cambios genera escrituras innecesarias en SQLite.
      const row = await (db as any).getFirstAsync(
        'SELECT 1 AS has FROM messages_history WHERE contact_hash = ? AND is_mine = 0 AND is_read = 0 LIMIT 1;',
        [contactHash]
      );
      if (!row) return;
      await (db as any).runAsync(
        'UPDATE messages_history SET is_read = 1 WHERE contact_hash = ? AND is_mine = 0 AND is_read = 0;',
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

  async getAllContactsRaw(): Promise<Array<{ contact_hash: string; public_key: string; alias_local: string | null; is_blocked: boolean; is_pinned: boolean; is_muted: boolean; is_archived: boolean; avatar_bg: string | null; avatar_icon: string | null }>> {
    return this.withDb(async (db) => {
      const rows = await (db as any).getAllAsync(
        'SELECT contact_hash, public_key, alias_local, is_blocked, is_pinned, is_muted, is_archived, avatar_bg, avatar_icon FROM contacts_vault;'
      );
      return (rows ?? []).map((r: any) => ({
        contact_hash: r.contact_hash,
        public_key: r.public_key,
        alias_local: r.alias_local ? this.safeDecrypt(r.alias_local) : null,
        is_blocked: r.is_blocked === 1,
        is_pinned: r.is_pinned === 1,
        is_muted: r.is_muted === 1,
        is_archived: r.is_archived === 1,
        avatar_bg: r.avatar_bg ?? null,
        avatar_icon: r.avatar_icon ?? null,
      }));
    });
  }

  /** ¿Está bloqueado este contacto? Devuelve false si no existe en absoluto. */
  async isContactBlocked(contactHash: string): Promise<boolean> {
    return this.withDb(async (db) => {
      const row = await (db as any).getFirstAsync(
        'SELECT is_blocked FROM contacts_vault WHERE contact_hash = ? LIMIT 1;',
        [contactHash]
      );
      return row?.is_blocked === 1;
    });
  }

  async setContactBlocked(contactHash: string, blocked: boolean): Promise<void> {
    await this.withDb(async (db) => {
      await (db as any).runAsync(
        'UPDATE contacts_vault SET is_blocked = ? WHERE contact_hash = ?;',
        [blocked ? 1 : 0, contactHash]
      );
    });
  }

  async setContactPinned(contactHash: string, pinned: boolean): Promise<void> {
    await this.withDb(async (db) => {
      await (db as any).runAsync(
        'UPDATE contacts_vault SET is_pinned = ? WHERE contact_hash = ?;',
        [pinned ? 1 : 0, contactHash]
      );
    });
  }

  async setContactMuted(contactHash: string, muted: boolean): Promise<void> {
    await this.withDb(async (db) => {
      await (db as any).runAsync(
        'UPDATE contacts_vault SET is_muted = ? WHERE contact_hash = ?;',
        [muted ? 1 : 0, contactHash]
      );
    });
  }

  async setContactArchived(contactHash: string, archived: boolean): Promise<void> {
    await this.withDb(async (db) => {
      await (db as any).runAsync(
        'UPDATE contacts_vault SET is_archived = ? WHERE contact_hash = ?;',
        [archived ? 1 : 0, contactHash]
      );
    });
  }

  async setContactAvatarColors(contactHash: string, bg: string | null, icon: string | null): Promise<void> {
    await this.withDb(async (db) => {
      await (db as any).runAsync(
        'UPDATE contacts_vault SET avatar_bg = ?, avatar_icon = ? WHERE contact_hash = ?;',
        [bg, icon, contactHash]
      );
    });
  }

  /**
   * Returns the most recent message for each contact in a single query.
   * Much more efficient than N separate queries.
   */
  async getLastMessagePerContact(): Promise<Map<string, { text: string; isMine: boolean; isRead: boolean; createdAt: number }>> {
    return this.withDb(async (db) => {
      const rows = await (db as any).getAllAsync(
        `SELECT m.contact_hash, m.plaintext, m.is_mine, m.is_read, m.created_at
         FROM messages_history m
         INNER JOIN (
           SELECT contact_hash, MAX(msg_id) AS max_id
           FROM messages_history
           GROUP BY contact_hash
         ) latest ON m.contact_hash = latest.contact_hash AND m.msg_id = latest.max_id;`
      );
      const map = new Map<string, { text: string; isMine: boolean; isRead: boolean; createdAt: number }>();
      for (const r of rows ?? []) {
        map.set(r.contact_hash, {
          text: this.safeDecrypt(r.plaintext),
          isMine: r.is_mine === 1,
          isRead: r.is_mine === 1 || r.is_read === 1,
          createdAt: r.created_at,
        });
      }
      return map;
    });
  }

  /** TTL en segundos del modo temporal para este contacto. NULL/0 = off. */
  async getEphemeralTtl(contactHash: string): Promise<number | null> {
    return this.withDb(async (db) => {
      const row = await (db as any).getFirstAsync(
        'SELECT ephemeral_ttl FROM contacts_vault WHERE contact_hash = ? LIMIT 1;',
        [contactHash]
      );
      const v = row?.ephemeral_ttl;
      return typeof v === 'number' && v > 0 ? v : null;
    });
  }

  async setEphemeralTtl(contactHash: string, ttlSeconds: number | null): Promise<void> {
    await this.withDb(async (db) => {
      await (db as any).runAsync(
        'UPDATE contacts_vault SET ephemeral_ttl = ? WHERE contact_hash = ?;',
        [ttlSeconds ?? null, contactHash]
      );
    });
  }

  /**
   * Devuelve la propuesta pendiente de mensajes temporales para un contacto,
   * o null si no hay. Una propuesta queda en cola hasta que el usuario la
   * acepta o la rechaza desde la UI.
   */
  async getPendingEphemeralProposal(contactHash: string): Promise<number | null> {
    return this.withDb(async (db) => {
      const row = await (db as any).getFirstAsync(
        'SELECT ttl FROM pending_ephemeral WHERE contact_hash = ? LIMIT 1;',
        [contactHash]
      );
      return typeof row?.ttl === 'number' ? row.ttl : null;
    });
  }

  async upsertPendingEphemeralProposal(contactHash: string, ttl: number): Promise<void> {
    await this.withDb(async (db) => {
      await (db as any).runAsync(
        `INSERT INTO pending_ephemeral (contact_hash, ttl, received_at)
         VALUES (?, ?, ?)
         ON CONFLICT(contact_hash) DO UPDATE SET ttl = excluded.ttl, received_at = excluded.received_at;`,
        [contactHash, ttl, Date.now()]
      );
    });
  }

  async clearPendingEphemeralProposal(contactHash: string): Promise<void> {
    await this.withDb(async (db) => {
      await (db as any).runAsync(
        'DELETE FROM pending_ephemeral WHERE contact_hash = ?;',
        [contactHash]
      );
    });
  }

  /**
   * Borra de forma irrecuperable los mensajes cuya `expires_at` ya pasó.
   * Lo invoca un worker periódico desde la app. Devuelve cuántos se borraron.
   */
  async purgeExpiredMessages(now: number = Date.now()): Promise<number> {
    return this.withDb(async (db) => {
      const result = await (db as any).runAsync(
        'DELETE FROM messages_history WHERE expires_at IS NOT NULL AND expires_at <= ?;',
        [now]
      );
      return result?.changes ?? 0;
    });
  }

  /** Elimina un contacto de la bóveda. NO borra su historial; usa deleteMessagesByContact aparte. */
  async deleteContact(contactHash: string): Promise<void> {
    await this.withDb(async (db) => {
      await (db as any).runAsync('DELETE FROM contacts_vault WHERE contact_hash = ?;', [contactHash]);
    });
  }

  /** Elimina todo el historial de mensajes con un contacto (no afecta al contacto en sí). */
  async deleteMessagesByContact(contactHash: string): Promise<void> {
    await this.withDb(async (db) => {
      await (db as any).runAsync('DELETE FROM messages_history WHERE contact_hash = ?;', [contactHash]);
    });
  }
  async upsertContact(contactHash: string, publicKey: string, alias: string | null): Promise<void> {
    await this.withDb(async (db) => {
      const storedAlias = alias && dataKeyService.isReady() ? dataKeyService.encrypt(alias) : alias;
      await (db as any).runAsync(
        `INSERT INTO contacts_vault (contact_hash, public_key, alias_local)
         VALUES (?, ?, ?)
         ON CONFLICT(contact_hash) DO UPDATE SET public_key = excluded.public_key, alias_local = excluded.alias_local;`,
        [contactHash, publicKey, storedAlias]
      );
    });
  }

  /**
   * Cola persistente de operaciones pendientes (típicamente envíos de mensajes
   * que el usuario inició estando offline). Se procesa en cuanto vuelve la
   * conectividad. Usamos `sync_queue` como tabla genérica con `task_type`
   * para diferenciar futuros tipos de tareas.
   */
  async enqueueOutgoing(
    recipientId: string,
    plaintext: string,
    sentAt: number,
    replyTo: { id: string; text: string; isMine: boolean } | null = null,
  ): Promise<void> {
    await this.withDb(async (db) => {
      const payload = JSON.stringify({ recipientId, plaintext, sentAt, replyTo });
      await (db as any).runAsync(
        'INSERT INTO sync_queue (task_type, task_payload, created_at) VALUES (?, ?, ?);',
        ['send_message', payload, Date.now()]
      );
    });
  }

  async getQueuedOutgoing(): Promise<Array<{ taskId: number; recipientId: string; plaintext: string; sentAt: number; replyTo: { id: string; text: string; isMine: boolean } | null }>> {
    return this.withDb(async (db) => {
      const rows = await (db as any).getAllAsync(
        `SELECT task_id, task_payload FROM sync_queue WHERE task_type = 'send_message' ORDER BY task_id ASC;`
      );
      return (rows ?? []).map((r: any) => {
        try {
          const parsed = JSON.parse(typeof r.task_payload === 'string' ? r.task_payload : new TextDecoder().decode(r.task_payload));
          return {
            taskId: r.task_id,
            recipientId: String(parsed.recipientId ?? ''),
            plaintext: String(parsed.plaintext ?? ''),
            sentAt: Number(parsed.sentAt ?? Date.now()),
            replyTo: parsed.replyTo ?? null,
          };
        } catch {
          return null;
        }
      }).filter(Boolean) as any;
    });
  }

  async dequeueOutgoing(taskId: number): Promise<void> {
    await this.withDb(async (db) => {
      await (db as any).runAsync('DELETE FROM sync_queue WHERE task_id = ?;', [taskId]);
    });
  }

  /**
   * Devuelve el siguiente número de secuencia de envío para un contacto e
   * incrementa el contador en disco de forma atómica. Empieza en 1.
   *
   * Sirve como anti-replay: cada mensaje saliente lleva un `seq` único y
   * monotónicamente creciente respecto a (yo → ese contacto). El receptor
   * los compara con `markIncomingSeqIfNew`.
   */
  async getNextOutgoingSeq(contactHash: string): Promise<number> {
    return this.withDb(async (db) => {
      await (db as any).runAsync(
        `INSERT INTO outgoing_seq (contact_hash, next_seq) VALUES (?, 1)
         ON CONFLICT(contact_hash) DO UPDATE SET next_seq = next_seq + 1;`,
        [contactHash]
      );
      const row = await (db as any).getFirstAsync(
        `SELECT next_seq FROM outgoing_seq WHERE contact_hash = ? LIMIT 1;`,
        [contactHash]
      );
      return row?.next_seq ?? 1;
    });
  }

  /**
   * Registra un `seq` recibido de un contacto. Devuelve `true` si el seq es
   * nuevo (mensaje legítimo) o `false` si ya estaba registrado (replay).
   *
   * Usa una restricción UNIQUE sobre (contact_hash, seq) para que el chequeo
   * sea atómico: dos llamadas simultáneas con el mismo seq no pueden ambas
   * ver "nuevo".
   */
  async markIncomingSeqIfNew(contactHash: string, seq: number): Promise<boolean> {
    return this.withDb(async (db) => {
      const result = await (db as any).runAsync(
        `INSERT OR IGNORE INTO replay_seen (contact_hash, seq, received_at) VALUES (?, ?, ?);`,
        [contactHash, seq, Date.now()]
      );
      return (result?.changes ?? 0) > 0;
    });
  }

  async clearAllData(): Promise<void> {
    await this.withDb(async (db) => {
      await (db as any).execAsync(`
        DELETE FROM contacts_vault;
        DELETE FROM messages_history;
        DELETE FROM key_store;
        DELETE FROM sync_queue;
        DELETE FROM outgoing_seq;
        DELETE FROM replay_seen;
        DELETE FROM groups_vault;
        DELETE FROM group_members;
      `);
    });
  }

  async createGroup(name: string, memberIds: string[], adminId?: string, description: string | null = null): Promise<string> {
    const groupId = `GROUP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    await this.withDb(async (db) => {
      await (db as any).runAsync(
        'INSERT INTO groups_vault (group_id, name, description, admin_id, only_admin_can_post, created_at) VALUES (?, ?, ?, ?, 0, ?);',
        [groupId, name.trim(), description?.trim() || null, adminId ?? null, Date.now()]
      );
      const members = Array.from(new Set([adminId, ...memberIds].filter(Boolean) as string[]));
      for (const memberId of members) {
        await (db as any).runAsync(
          'INSERT OR IGNORE INTO group_members (group_id, contact_hash) VALUES (?, ?);',
          [groupId, memberId]
        );
      }
    });
    return groupId;
  }

  async upsertGroup(groupId: string, name: string, memberIds: string[] = [], adminId?: string | null, onlyAdminCanPost?: boolean, description?: string | null): Promise<void> {
    await this.withDb(async (db) => {
      await (db as any).runAsync(
        `INSERT INTO groups_vault (group_id, name, description, admin_id, only_admin_can_post, created_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(group_id) DO UPDATE SET
           name = excluded.name,
           description = COALESCE(excluded.description, groups_vault.description),
           admin_id = COALESCE(excluded.admin_id, groups_vault.admin_id),
           only_admin_can_post = excluded.only_admin_can_post;`,
        [groupId, name.trim(), description?.trim() || null, adminId ?? null, onlyAdminCanPost ? 1 : 0, Date.now()]
      );
      const members = Array.from(new Set([adminId ?? undefined, ...memberIds].filter(Boolean) as string[]));
      for (const memberId of members) {
        await (db as any).runAsync(
          'INSERT OR IGNORE INTO group_members (group_id, contact_hash) VALUES (?, ?);',
          [groupId, memberId]
        );
      }
    });
  }

  async getAllGroups(): Promise<Array<{ groupId: string; name: string; description: string | null; memberCount: number; createdAt: number; adminId: string | null; onlyAdminCanPost: boolean }>> {
    return this.withDb(async (db) => {
      const rows = await (db as any).getAllAsync(
        `SELECT g.group_id, g.name, g.description, g.created_at, g.admin_id, g.only_admin_can_post, COUNT(m.contact_hash) AS member_count
         FROM groups_vault g
         LEFT JOIN group_members m ON g.group_id = m.group_id
         GROUP BY g.group_id, g.name, g.description, g.created_at, g.admin_id, g.only_admin_can_post
         ORDER BY g.created_at DESC;`
      );
      return (rows ?? []).map((r: any) => ({
        groupId: r.group_id,
        name: r.name,
        description: r.description ?? null,
        memberCount: r.member_count ?? 0,
        createdAt: r.created_at ?? 0,
        adminId: r.admin_id ?? null,
        onlyAdminCanPost: r.only_admin_can_post === 1,
      }));
    });
  }

  async getGroup(groupId: string): Promise<{ groupId: string; name: string; description: string | null; memberIds: string[]; adminId: string | null; onlyAdminCanPost: boolean } | null> {
    return this.withDb(async (db) => {
      const group = await (db as any).getFirstAsync(
        'SELECT group_id, name, description, admin_id, only_admin_can_post FROM groups_vault WHERE group_id = ? LIMIT 1;',
        [groupId]
      );
      if (!group) return null;
      const members = await (db as any).getAllAsync(
        'SELECT contact_hash FROM group_members WHERE group_id = ? ORDER BY contact_hash ASC;',
        [groupId]
      );
      const memberIds = Array.from(new Set([
        group.admin_id ? String(group.admin_id) : null,
        ...(members ?? []).map((m: any) => String(m.contact_hash)),
      ].filter(Boolean) as string[]));
      return {
        groupId: group.group_id,
        name: group.name,
        description: group.description ?? null,
        adminId: group.admin_id ?? null,
        onlyAdminCanPost: group.only_admin_can_post === 1,
        memberIds,
      };
    });
  }

  async setGroupOnlyAdminCanPost(groupId: string, enabled: boolean): Promise<void> {
    await this.withDb(async (db) => {
      await (db as any).runAsync(
        'UPDATE groups_vault SET only_admin_can_post = ? WHERE group_id = ?;',
        [enabled ? 1 : 0, groupId]
      );
    });
  }

  async setGroupDescription(groupId: string, description: string | null): Promise<void> {
    await this.withDb(async (db) => {
      await (db as any).runAsync(
        'UPDATE groups_vault SET description = ? WHERE group_id = ?;',
        [description?.trim() || null, groupId]
      );
    });
  }

  async addGroupMember(groupId: string, contactHash: string): Promise<void> {
    await this.withDb(async (db) => {
      await (db as any).runAsync(
        'INSERT OR IGNORE INTO group_members (group_id, contact_hash) VALUES (?, ?);',
        [groupId, contactHash]
      );
    });
  }

  async removeGroupMember(groupId: string, contactHash: string): Promise<void> {
    await this.withDb(async (db) => {
      await (db as any).runAsync(
        'DELETE FROM group_members WHERE group_id = ? AND contact_hash = ?;',
        [groupId, contactHash]
      );
    });
  }

  async deleteGroup(groupId: string): Promise<void> {
    await this.withDb(async (db) => {
      await (db as any).runAsync('DELETE FROM group_members WHERE group_id = ?;', [groupId]);
      await (db as any).runAsync('DELETE FROM groups_vault WHERE group_id = ?;', [groupId]);
      await (db as any).runAsync('DELETE FROM messages_history WHERE contact_hash = ?;', [groupId]);
    });
  }
}

export const databaseService = new DatabaseService();
