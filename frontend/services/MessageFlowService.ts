import QuickCrypto from 'react-native-quick-crypto';
import { databaseService } from './DatabaseService';
import { messageApiService } from './MessageApiService';
import { messageCryptoService } from './MessageCryptoService';
import { authSessionService } from './AuthSessionService';
import { contactsService } from './ContactsService';

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

  async sendMessage(input: SendMessageInput): Promise<void> {
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
    const envelope = JSON.stringify({ from: senderIdentity.id, pk: senderIdentity.publicKey, text: input.plaintext, ts: sentAt });
    const encryptedPayload = messageCryptoService.encryptForRecipient(envelope, recipientPublicKey);

    await messageApiService.sendMessage(input.recipientId, encryptedPayload);
    await databaseService.saveDecryptedMessage(input.recipientId, input.plaintext, true, sentAt);
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
    const packets = await messageApiService.getMessages(myId);
    if (packets.length === 0) {
      return { senders: [], newContacts: [] };
    }

    const receivedFrom = new Set<string>();
    const newContacts = new Set<string>();

    for (const packet of packets) {
      try {
        const decrypted = messageCryptoService.decryptWithPrivateKey(packet, localPrivateKey);

        let envelope: { from: string; pk?: string; text: string; type?: string; ts?: number };
        try {
          envelope = JSON.parse(decrypted);
        } catch {
          // Payload sin envoltorio reconocible: descartar para no contaminar el historial
          // con mensajes huérfanos sin contactHash.
          console.warn('[syncInbox] payload sin envoltorio descartado');
          continue;
        }

        const contactHash = envelope.from;
        const plaintext = envelope.text;
        const isHandshake = envelope.type === 'handshake';
        const senderTs = typeof envelope.ts === 'number' ? envelope.ts : undefined;

        if (!contactHash) {
          // Sobre malformado sin remitente: también descartamos.
          continue;
        }

        if (envelope.pk) {
          const existing = await databaseService.getContactPublicKey(contactHash);
          if (!existing) {
            // Anti-spoofing: igual que en saveContactFromQR, verificamos que la pk
            // declarada genere realmente el HNET-id del remitente. Si no cuadra,
            // alguien intenta hacerse pasar por otro identificador.
            if (fingerprintFromPublicKey(envelope.pk) !== contactHash) {
              console.warn('[syncInbox] handshake/mensaje con pk no coincidente con el id, descartado');
              continue;
            }
            await contactsService.saveContact(contactHash, envelope.pk);
            newContacts.add(contactHash);
          }
        }

        // Los handshakes sólo sirven para intercambiar identidad; no se guardan en el historial
        if (isHandshake) continue;

        receivedFrom.add(contactHash);
        // Usar el timestamp del emisor para que el orden sea idéntico en ambos dispositivos
        await databaseService.saveDecryptedMessage(contactHash, plaintext, false, senderTs);
      } catch (err) {
        // Paquete corrupto, formato antiguo o destinatario equivocado: lo descartamos para que
        // el ack lo borre del buzón y no rompa toda la sincronización.
        console.warn('[syncInbox] paquete inválido descartado:', err);
      }
    }

    // Confirmar recepción al servidor SIEMPRE para que los paquetes corruptos se vacíen
    try {
      await messageApiService.ackMessages();
    } catch (err) {
      console.warn('[syncInbox] ack falló:', err);
    }

    return { senders: Array.from(receivedFrom), newContacts: Array.from(newContacts) };
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

    const envelope = JSON.stringify({ from: senderIdentity.id, pk: senderIdentity.publicKey, text: '', type: 'handshake' });
    const encryptedPayload = messageCryptoService.encryptForRecipient(envelope, recipientPublicKey);

    await messageApiService.sendMessage(recipientId, encryptedPayload);
  }
}

export const messageFlowService = new MessageFlowService();
