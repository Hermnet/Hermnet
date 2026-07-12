import QuickCrypto from './CryptoService';
import { databaseService } from './DatabaseService';
import { messageApiService } from './MessageApiService';
import { messageCryptoService } from './MessageCryptoService';
import { authSessionService } from './AuthSessionService';
import { contactsService } from './ContactsService';
import { identityService } from './IdentityService';
import { prefsService } from './PrefsService';

/**
 * Datos canónicos que se firman en cada mensaje. La serialización debe ser
 * estable (mismo orden de claves en emisor y receptor) para que la firma
 * verifique correctamente. Como JS preserva el orden de inserción, basta con
 * construir el objeto siempre con la misma secuencia.
 */
interface CanonicalEnvelope {
    from: string;
    pk: string;
    text: string;
    ts?: number;
    type?: string;
    /** Anti-replay: contador monotónico por (emisor → receptor). */
    seq?: number;
    /** Para sobres `ephemeral_request`/`ephemeral_accept`: TTL propuesto/aceptado en segundos. */
    ttl?: number;
    /** Contexto de reply-to: texto e id del mensaje al que se responde. */
    replyTo?: { id: string; text: string; isMine: boolean } | null;
    groupId?: string;
    groupName?: string;
    groupDescription?: string;
    groupAdminId?: string;
    groupMembers?: string[];
    groupOnlyAdminCanPost?: boolean;
    senderName?: string;
}

function canonicalize(envelope: CanonicalEnvelope): string {
    // Orden fijo de claves para garantizar bytes idénticos en emisor y receptor.
    const ordered: Record<string, unknown> = { from: envelope.from, pk: envelope.pk, text: envelope.text };
    if (envelope.ts !== undefined) ordered.ts = envelope.ts;
    if (envelope.type !== undefined) ordered.type = envelope.type;
    if (envelope.seq !== undefined) ordered.seq = envelope.seq;
    if (envelope.ttl !== undefined) ordered.ttl = envelope.ttl;
    if (envelope.replyTo) ordered.replyTo = envelope.replyTo;
    if (envelope.groupId) ordered.groupId = envelope.groupId;
    if (envelope.groupName) ordered.groupName = envelope.groupName;
    if (envelope.groupDescription) ordered.groupDescription = envelope.groupDescription;
    if (envelope.groupAdminId) ordered.groupAdminId = envelope.groupAdminId;
    if (envelope.groupMembers) ordered.groupMembers = envelope.groupMembers;
    if (envelope.groupOnlyAdminCanPost !== undefined) ordered.groupOnlyAdminCanPost = envelope.groupOnlyAdminCanPost;
    if (envelope.senderName) ordered.senderName = envelope.senderName;
    return JSON.stringify(ordered);
}

/** Recalcula el HNET-id que debería tener una pk dada (replica IdentityService.generateIdentity). */
function fingerprintFromPublicKey(publicKey: string): string {
    const hash = QuickCrypto
        .createHash('sha256')
        .update(publicKey)
        .digest('hex' as any)
        .toString();
    return 'HNET-' + hash.substring(0, 16).toUpperCase();
}

export interface SendMessageInput {
  recipientId: string;
  plaintext: string;
  /** Timestamp opcional del emisor; si se omite, se usa Date.now() al iniciar el envío. */
  sentAt?: number;
  /** Contexto del mensaje al que se responde, si es una respuesta. */
  replyTo?: { id: string; text: string; isMine: boolean } | null;
}

/**
 * Orquesta el flujo seguro de mensajes (envío y recepción).
 *
 * Pipeline de envío:
 *   plaintext → JSON envelope {from, pk, text, ts} → cifrado híbrido AES-256-GCM + RSA-OAEP
 *   → POST /api/messages (payload binario opaco)
 *
 * Pipeline de recepción:
 *   GET /api/messages → descifrar con clave privada local → parsear envelope → guardar en SQLite
 */
export class MessageFlowService {
  /**
   * Promesa de sync en curso (si la hay). Si dos callers piden syncInbox simultáneamente
   * (p.ej. el polling de ChatsScreen y el botón ↻ de ChatRoomScreen), se les devuelve la
   * misma promesa para evitar procesar el buzón dos veces y duplicar mensajes en la BD.
   */
  private inflightSync: Promise<{ senders: string[]; newContacts: string[] }> | null = null;
  private sendTail: Promise<void> = Promise.resolve();

  /**
   * Listeners que se notifican cuando la cola offline drena algún mensaje
   * (paso PENDING → SENT). Los chats abiertos se suscriben para recargar el
   * histórico y refrescar el icono de cada mensaje.
   */
  private queueListeners = new Set<() => void>();
  onQueueFlushed(listener: () => void): () => void {
    this.queueListeners.add(listener);
    return () => this.queueListeners.delete(listener);
  }
  private emitQueueFlushed(): void {
    for (const l of this.queueListeners) {
      try { l(); } catch { /* aislar listeners */ }
    }
  }

  /**
   * Listeners notificados cuando un `syncInbox` guarda al menos un mensaje
   * entrante nuevo. Permite que un chat abierto se refresque por evento en vez
   * de sondear la BD local con un reloj: sin mensajes nuevos, no se descifra
   * nada (ahorro de CPU/batería con el chat en primer plano).
   */
  private inboxListeners = new Set<() => void>();
  onInboxSynced(listener: () => void): () => void {
    this.inboxListeners.add(listener);
    return () => this.inboxListeners.delete(listener);
  }
  private emitInboxSynced(): void {
    for (const l of this.inboxListeners) {
      try { l(); } catch { /* aislar listeners */ }
    }
  }

  async sendMessage(input: SendMessageInput): Promise<void> {
    const op = this.sendTail.then(() => this.runSendMessage(input));
    this.sendTail = op.catch(() => {});
    return op;
  }

  private async runSendMessage(input: SendMessageInput): Promise<void> {
    const [recipientPublicKey, senderIdentity] = await Promise.all([
      databaseService.getContactPublicKey(input.recipientId),
      authSessionService.getIdentity(),
    ]);

    if (!recipientPublicKey) {
      throw new Error(`Recipient public key not found for ${input.recipientId}`);
    }
    if (!senderIdentity) {
      throw new Error('No hay identidad local para firmar el mensaje');
    }

    const sentAt = input.sentAt ?? Date.now();
    // Guardamos el mensaje INMEDIATAMENTE como PENDING. El icono en la UI será
    // un reloj (no un check). Solo cuando el server confirme se promueve a SENT.
    await databaseService.saveDecryptedMessage(input.recipientId, input.plaintext, true, sentAt, 'PENDING', input.replyTo ?? null);

    try {
      await this.dispatchToServer(input.recipientId, senderIdentity, recipientPublicKey, input.plaintext, sentAt, input.replyTo);
      await databaseService.updateMessageStatus(input.recipientId, sentAt, 'SENT');
    } catch (err) {
      // Cualquier fallo en el envío (red, timeout, 5xx) → mensaje a la cola
      // persistente. Cuando vuelva la conectividad, `flushQueue` los envía y
      // promueve su status a SENT. La UI mantiene el icono de reloj hasta entonces.
      console.warn('[sendMessage] envío diferido a cola por:', err);
      await databaseService.enqueueOutgoing(input.recipientId, input.plaintext, sentAt, input.replyTo ?? null);
    }
  }

  /**
   * Cifra y manda al servidor. Se llama desde sendMessage (camino normal) y
   * desde flushQueue (al recuperar conectividad). Cada llamada consume un
   * `seq` nuevo para mantener la integridad anti-replay.
   */
  private async dispatchToServer(
    recipientId: string,
    senderIdentity: { id: string; publicKey: string; privateKey: string },
    recipientPublicKey: string,
    plaintext: string,
    sentAt: number,
    replyTo?: { id: string; text: string; isMine: boolean } | null,
  ): Promise<void> {
    const seq = await databaseService.getNextOutgoingSeq(recipientId);
    const canonical: CanonicalEnvelope = {
        from: senderIdentity.id,
        pk: senderIdentity.publicKey,
        text: plaintext,
        ts: sentAt,
        seq,
        ...(replyTo ? { replyTo: { id: replyTo.id, text: replyTo.text, isMine: !replyTo.isMine } } : {}),
    };
    const sig = identityService.signNonce(senderIdentity.privateKey, canonicalize(canonical));
    const envelope = JSON.stringify({ ...canonical, sig });
    const encryptedPayload = messageCryptoService.encryptForRecipient(envelope, recipientPublicKey);
    await messageApiService.sendMessage(recipientId, encryptedPayload);
  }

  /**
   * Drena la cola de envío. Invocada al volver la conectividad (NetInfo) y al
   * arrancar la app. Reintenta uno por uno; si alguno falla, lo deja en cola
   * para el próximo intento (no avanza al siguiente para preservar el orden).
   */
  async flushQueue(): Promise<void> {
    await this.sendTail.catch(() => {});
    const senderIdentity = await authSessionService.getIdentity();
    if (!senderIdentity) return;

    const queued = await databaseService.getQueuedOutgoing();
    let anyDrained = false;
    for (const task of queued) {
      try {
        const recipientPublicKey = await databaseService.getContactPublicKey(task.recipientId);
        if (!recipientPublicKey) {
          // Receiver eliminado del vault: mensaje irrecuperable, lo descartamos.
          await databaseService.dequeueOutgoing(task.taskId);
          continue;
        }
        await this.dispatchToServer(task.recipientId, senderIdentity, recipientPublicKey, task.plaintext, task.sentAt, task.replyTo);
        // Promueve el status del mensaje en BD: el reloj ⏱ pasa a check ✓.
        await databaseService.updateMessageStatus(task.recipientId, task.sentAt, 'SENT');
        await databaseService.dequeueOutgoing(task.taskId);
        anyDrained = true;
      } catch (err) {
        // Sigue offline o server caído: dejamos el resto en cola y abortamos.
        console.warn('[flushQueue] aborta, sigue sin red:', err);
        if (anyDrained) this.emitQueueFlushed();
        return;
      }
    }
    if (anyDrained) this.emitQueueFlushed();
  }

  /**
   * Sincroniza el buzón. Devuelve los contactos que enviaron mensajes en esta tanda
   * y, separadamente, los que se han añadido por primera vez (handshake o primer
   * mensaje de un desconocido) — el llamador puede usar esa segunda lista para
   * pedir al usuario que les ponga un alias.
   */
  async syncInbox(myId: string, localPrivateKey: string): Promise<{ senders: string[]; newContacts: string[] }> {
    // Si ya hay un sync en curso, devolver la misma promesa.
    if (this.inflightSync) return this.inflightSync;
    this.inflightSync = this.runSyncInbox(myId, localPrivateKey)
      .finally(() => { this.inflightSync = null; });
    return this.inflightSync;
  }

  private async runSyncInbox(myId: string, localPrivateKey: string): Promise<{ senders: string[]; newContacts: string[] }> {
    const { packets, ackCutoff } = await messageApiService.getMessages(myId);
    if (packets.length === 0) {
      return { senders: [], newContacts: [] };
    }

    if (__DEV__) {
      console.log(`[syncInbox] ${packets.length} paquete(s) recibido(s) para ${myId.slice(0, 12)}…`);
    }

    const receivedFrom = new Set<string>();
    const newContacts = new Set<string>();

    for (const entry of packets) {
      try {
        const packet = entry.payload;
        if (__DEV__) {
          console.log(`[syncInbox] paquete: ${packet.length} bytes`);
        }
        const decrypted = messageCryptoService.decryptWithPrivateKey(packet, localPrivateKey);

        let envelope: { from: string; pk?: string; text: string; type?: string; ts?: number; sig?: string; seq?: number; ttl?: number; replyTo?: { id: string; text: string; isMine: boolean } | null; groupId?: string; groupName?: string; groupDescription?: string; groupAdminId?: string; groupMembers?: string[]; groupOnlyAdminCanPost?: boolean; senderName?: string };
        try {
          envelope = JSON.parse(decrypted);
        } catch {
          // Payload sin envoltorio reconocible: descartar para no contaminar el historial
          // con mensajes huérfanos sin contactHash.
          if (__DEV__) {
            console.warn(`[syncInbox] payload sin envoltorio descartado — primeros 120 chars: ${decrypted.slice(0, 120)}`);
          } else {
            console.warn('[syncInbox] payload sin envoltorio descartado');
          }
          continue;
        }

        const contactHash = envelope.from;
        const plaintext = envelope.text;
        const isHandshake = envelope.type === 'handshake';
        const isEphemeralRequest = envelope.type === 'ephemeral_request';
        const isEphemeralAccept = envelope.type === 'ephemeral_accept';
        const isEphemeralDisable = envelope.type === 'ephemeral_disable';
        const senderTs = typeof envelope.ts === 'number' ? envelope.ts : undefined;

        if (!contactHash) {
          // Sobre malformado sin remitente: también descartamos.
          continue;
        }

        // Verificación de firma RSA-SHA256 OBLIGATORIA: confirma que el mensaje
        // proviene del titular de la SK correspondiente a la pk del remitente.
        // Un sobre sin firma se descarta sin más — como el payload se cifra con
        // la pk pública del receptor (conocida por cualquiera), sin esta firma
        // cualquiera podría inyectar mensajes falsos en el historial.
        if (!envelope.sig) {
          console.warn('[syncInbox] sobre sin firma descartado');
          continue;
        }
        // TOFU pinning: si el contacto YA existe, la firma se valida SIEMPRE
        // contra la pk fijada localmente, nunca contra la `pk` que venga en el
        // sobre (un atacante podría sustituirla por la suya y firmar con su
        // propia SK para hacerse pasar por el contacto). Solo los contactos
        // nuevos usan la pk del sobre, y aún así deben pasar el check de
        // fingerprint de más abajo antes de guardarse.
        const pinnedKey = await databaseService.getContactPublicKey(contactHash);
        const signingKey = pinnedKey ?? envelope.pk;
        if (!signingKey) {
          console.warn('[syncInbox] no se puede verificar la firma sin pk conocida, descartado');
          continue;
        }
        const canonicalData = canonicalize({
          from: contactHash,
          pk: signingKey,
          text: plaintext,
          ts: senderTs,
          type: envelope.type,
          seq: envelope.seq,
          ttl: envelope.ttl,
          replyTo: envelope.replyTo,
          groupId: envelope.groupId,
          groupName: envelope.groupName,
          groupDescription: envelope.groupDescription,
          groupAdminId: envelope.groupAdminId,
          groupMembers: envelope.groupMembers,
          groupOnlyAdminCanPost: envelope.groupOnlyAdminCanPost,
          senderName: envelope.senderName,
        });
        const signatureValid = identityService.verifySignature(signingKey, canonicalData, envelope.sig);
        if (!signatureValid) {
          console.warn('[syncInbox] firma inválida, sobre descartado');
          continue;
        }

        // Anti-replay OBLIGATORIO: cada sobre debe traer un seq monotónico nuevo
        // para este remitente. Sin seq, o con un seq ya visto, se descarta —
        // alguien estaría reinyectando un paquete antiguo para reordenar o
        // duplicar el historial.
        if (typeof envelope.seq !== 'number') {
          console.warn('[syncInbox] sobre sin seq descartado');
          continue;
        }
        const seqIsNew = await databaseService.markIncomingSeqIfNew(contactHash, envelope.seq);
        if (!seqIsNew) {
          console.warn('[syncInbox] replay detectado (seq ya visto), descartado');
          continue;
        }

        // Bloqueo: si el contacto está marcado como bloqueado, descartamos el
        // mensaje silenciosamente. El ack al servidor se hace igual al final
        // del bucle, así que el paquete sale del buzón y no insiste.
        if (await databaseService.isContactBlocked(contactHash)) {
          continue;
        }

        if (envelope.pk && !pinnedKey) {
          // Contacto nuevo (no había pk fijada). Anti-spoofing: igual que en
          // saveContactFromQR, verificamos que la pk declarada genere realmente
          // el HNET-id del remitente. Si no cuadra, alguien intenta hacerse pasar
          // por otro identificador.
          if (fingerprintFromPublicKey(envelope.pk) !== contactHash) {
            console.warn('[syncInbox] handshake/mensaje con pk no coincidente con el id, descartado');
            continue;
          }
          await contactsService.saveContact(contactHash, envelope.pk);
          newContacts.add(contactHash);
        }

        // Los handshakes sólo sirven para intercambiar identidad; no se guardan en el historial
        if (isHandshake) continue;

        // Sobres del protocolo de mensajes temporales. No se guardan como mensajes
        // visibles; cada uno produce un side-effect distinto y el ack del bucle los limpia.
        if (isEphemeralRequest && typeof envelope.ttl === 'number' && envelope.ttl > 0) {
          // Guardamos la propuesta para que la UI la muestre cuando el usuario abra el chat.
          await databaseService.upsertPendingEphemeralProposal(contactHash, envelope.ttl);
          continue;
        }
        if (isEphemeralAccept && typeof envelope.ttl === 'number' && envelope.ttl > 0) {
          // El otro lado acepta la propuesta que YO había enviado. Aplico el TTL local.
          await databaseService.setEphemeralTtl(contactHash, envelope.ttl);
          await databaseService.clearPendingEphemeralProposal(contactHash);
          continue;
        }
        if (isEphemeralDisable) {
          await databaseService.setEphemeralTtl(contactHash, null);
          await databaseService.clearPendingEphemeralProposal(contactHash);
          continue;
        }

        receivedFrom.add(contactHash);
        // Usar el timestamp del emisor para que el orden sea idéntico en ambos dispositivos
        if (envelope.type === 'group_message' && envelope.groupId && envelope.groupName) {
          const members = Array.isArray(envelope.groupMembers) ? envelope.groupMembers : [contactHash];
          await databaseService.upsertGroup(envelope.groupId, envelope.groupName, members, envelope.groupAdminId ?? contactHash, envelope.groupOnlyAdminCanPost, envelope.groupDescription ?? null);
          await databaseService.saveDecryptedMessage(envelope.groupId, plaintext, false, senderTs, undefined, envelope.replyTo ?? null, envelope.seq, contactHash, envelope.senderName ?? null);
        } else {
          await databaseService.saveDecryptedMessage(contactHash, plaintext, false, senderTs, undefined, envelope.replyTo ?? null, envelope.seq, contactHash, envelope.senderName ?? null);
        }
      } catch (err) {
        // Paquete corrupto, formato antiguo o destinatario equivocado: lo descartamos para que
        // el ack lo borre del buzón y no rompa toda la sincronización.
        if (__DEV__) {
          console.warn('[syncInbox] paquete inválido (decrypt falló):', (err as Error)?.message ?? err);
        } else {
          console.warn('[syncInbox] paquete inválido descartado:', err);
        }
      }
    }

    // Confirmar recepción al servidor SIEMPRE para que los paquetes corruptos se vacíen
    try {
      await messageApiService.ackMessages(ackCutoff);
      if (__DEV__) {
        console.log('[syncInbox] ack exitoso');
      }
    } catch (err) {
      console.warn('[syncInbox] ack falló:', err);
    }

    // Si se guardó algún mensaje real (no solo handshakes/control), avisar a los
    // chats abiertos para que refresquen su vista sin necesidad de sondear.
    if (receivedFrom.size > 0) {
      this.emitInboxSynced();
    }

    return { senders: Array.from(receivedFrom), newContacts: Array.from(newContacts) };
  }

  /**
   * Envía un sobre de control (sin texto) al recipiente. Reusa el cifrado y la
   * firma del flujo normal; el receptor lo identifica por `envelope.type` y
   * actúa sobre él sin guardarlo en el historial.
   */
  private async sendControl(
    recipientId: string,
    type: 'ephemeral_request' | 'ephemeral_accept' | 'ephemeral_disable',
    ttl?: number,
  ): Promise<void> {
    const [recipientPublicKey, senderIdentity] = await Promise.all([
      databaseService.getContactPublicKey(recipientId),
      authSessionService.getIdentity(),
    ]);
    if (!recipientPublicKey) throw new Error(`Receiver pk not found for ${recipientId}`);
    if (!senderIdentity) throw new Error('No identity');

    const seq = await databaseService.getNextOutgoingSeq(recipientId);
    const canonical: CanonicalEnvelope = {
      from: senderIdentity.id,
      pk: senderIdentity.publicKey,
      text: '',
      type,
      seq,
    };
    if (ttl !== undefined) canonical.ttl = ttl;
    const sig = identityService.signNonce(senderIdentity.privateKey, canonicalize(canonical));
    const envelope = JSON.stringify({ ...canonical, sig });
    const encryptedPayload = messageCryptoService.encryptForRecipient(envelope, recipientPublicKey);
    await messageApiService.sendMessage(recipientId, encryptedPayload);
  }

  /**
   * El usuario propone activar mensajes temporales con `ttlSeconds` de TTL.
   * Manda un sobre `ephemeral_request` al receptor; este verá un modal donde
   * podrá aceptar o rechazar. NO se aplica TTL local hasta que llegue el ACCEPT.
   */
  async proposeEphemeral(recipientId: string, ttlSeconds: number): Promise<void> {
    await this.sendControl(recipientId, 'ephemeral_request', ttlSeconds);
  }

  /**
   * El usuario acepta una propuesta entrante. Aplica el TTL local y notifica
   * al iniciador con un sobre `ephemeral_accept`, que aplicará el TTL en su lado.
   */
  async acceptEphemeral(recipientId: string, ttlSeconds: number): Promise<void> {
    await databaseService.setEphemeralTtl(recipientId, ttlSeconds);
    await databaseService.clearPendingEphemeralProposal(recipientId);
    await this.sendControl(recipientId, 'ephemeral_accept', ttlSeconds);
  }

  /**
   * El usuario rechaza una propuesta entrante. Solo borra la propuesta local;
   * NO se notifica al iniciador (el otro lado simplemente nunca verá el ACCEPT
   * y entiende que se rechazó por timeout o silencio).
   */
  async rejectEphemeral(recipientId: string): Promise<void> {
    await databaseService.clearPendingEphemeralProposal(recipientId);
  }

  /**
   * Cualquiera de los dos lados puede desactivar el modo temporal en
   * cualquier momento. Aplica el cambio local y notifica al otro extremo.
   */
  async disableEphemeral(recipientId: string): Promise<void> {
    await databaseService.setEphemeralTtl(recipientId, null);
    await databaseService.clearPendingEphemeralProposal(recipientId);
    await this.sendControl(recipientId, 'ephemeral_disable');
  }

  /**
   * Envía un handshake silencioso al recipiente para que pueda auto-añadirte como contacto.
   * No genera ningún mensaje visible en el historial de ninguno de los dos lados.
   */
  async sendHandshake(recipientId: string): Promise<void> {
    const [recipientPublicKey, senderIdentity] = await Promise.all([
      databaseService.getContactPublicKey(recipientId),
      authSessionService.getIdentity(),
    ]);

    if (!recipientPublicKey) {
      throw new Error(`Clave pública del destinatario no encontrada para ${recipientId}`);
    }
    if (!senderIdentity) {
      throw new Error('No hay identidad local');
    }

    const seq = await databaseService.getNextOutgoingSeq(recipientId);
    const canonical: CanonicalEnvelope = {
        from: senderIdentity.id,
        pk: senderIdentity.publicKey,
        text: '',
        type: 'handshake',
        seq,
    };
    const sig = identityService.signNonce(senderIdentity.privateKey, canonicalize(canonical));
    const envelope = JSON.stringify({ ...canonical, sig });
    const encryptedPayload = messageCryptoService.encryptForRecipient(envelope, recipientPublicKey);

    await messageApiService.sendMessage(recipientId, encryptedPayload);
    if (__DEV__) {
      console.log(`[sendHandshake] enviado a ${recipientId.slice(0, 12)}… (${encryptedPayload.length} bytes)`);
    }
  }

  async sendGroupMessage(input: { groupId: string; groupName: string; memberIds: string[]; plaintext: string; sentAt?: number; replyTo?: { id: string; text: string; isMine: boolean } | null }): Promise<void> {
    const senderIdentity = await authSessionService.getIdentity();
    if (!senderIdentity) throw new Error('No hay identidad local');
    const profile = await prefsService.getProfilePrefs().catch(() => ({ displayName: '' }));
    const cleanName = profile.displayName.trim();

    const sentAt = input.sentAt ?? Date.now();
    const group = await databaseService.getGroup(input.groupId);
    await databaseService.saveDecryptedMessage(input.groupId, input.plaintext, true, sentAt, 'PENDING', input.replyTo ?? null, undefined, senderIdentity.id, cleanName || null);

    const allGroupMembers = Array.from(new Set([senderIdentity.id, ...input.memberIds.filter(Boolean)]));
    const uniqueMembers = allGroupMembers.filter(id => id !== senderIdentity.id);
    try {
      await Promise.all(uniqueMembers.map(async (memberId) => {
        const recipientPublicKey = await databaseService.getContactPublicKey(memberId);
        if (!recipientPublicKey) return;
        const seq = await databaseService.getNextOutgoingSeq(memberId);
        const canonical: CanonicalEnvelope = {
          from: senderIdentity.id,
          pk: senderIdentity.publicKey,
          text: input.plaintext,
          ts: sentAt,
          type: 'group_message',
          seq,
          groupId: input.groupId,
          groupName: input.groupName,
          ...(group?.description ? { groupDescription: group.description } : {}),
          groupAdminId: group?.adminId ?? senderIdentity.id,
          groupMembers: allGroupMembers,
          groupOnlyAdminCanPost: group?.onlyAdminCanPost ?? false,
          ...(cleanName ? { senderName: cleanName } : {}),
          ...(input.replyTo ? { replyTo: { id: input.replyTo.id, text: input.replyTo.text, isMine: !input.replyTo.isMine } } : {}),
        };
        const sig = identityService.signNonce(senderIdentity.privateKey, canonicalize(canonical));
        const envelope = JSON.stringify({ ...canonical, sig });
        const encryptedPayload = messageCryptoService.encryptForRecipient(envelope, recipientPublicKey);
        await messageApiService.sendMessage(memberId, encryptedPayload);
      }));
      await databaseService.updateMessageStatus(input.groupId, sentAt, 'SENT');
    } catch (err) {
      console.warn('[sendGroupMessage] envío parcial o fallido:', err);
    }
  }
}

export const messageFlowService = new MessageFlowService();
