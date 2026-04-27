import { databaseService } from './DatabaseService';
import { messageApiService } from './MessageApiService';
import { messageCryptoService } from './MessageCryptoService';
import { steganographyService } from './SteganographyService';
import { authSessionService } from './AuthSessionService';
import { contactsService } from './ContactsService';

export interface SendMessageInput {
  recipientId: string;
  plaintext: string;
  coverImageRgba?: Uint8ClampedArray;
}

/**
 * Orchestrates secure message flow for outbox and inbox pipelines.
 */
export class MessageFlowService {
  /**
   * Outbox pipeline:
   * plaintext -> encrypt -> steganography embed -> POST /api/messages
   */
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

    const sentAt = Date.now();
    const envelope = JSON.stringify({ from: senderIdentity.id, pk: senderIdentity.publicKey, text: input.plaintext, ts: sentAt });
    const encryptedPayload = messageCryptoService.encryptForRecipient(envelope, recipientPublicKey);

    const coverImage = input.coverImageRgba ?? this.createDefaultCoverImage();
    const stegoPacket = steganographyService.embedPayload(coverImage, encryptedPayload, {
      addNoisePadding: true,
    });

    await messageApiService.sendMessage(input.recipientId, stegoPacket);
    await databaseService.saveDecryptedMessage(input.recipientId, input.plaintext, true, sentAt);
  }

  /**
   * Inbox pipeline:
   * GET /api/messages -> extract stego bytes -> decrypt -> save to SQLite
   */
  /**
   * Sincroniza el buzón. Devuelve los contactos que enviaron mensajes en esta tanda
   * y, separadamente, los que se han añadido por primera vez (handshake o primer
   * mensaje de un desconocido) — el llamador puede usar esa segunda lista para
   * pedir al usuario que les ponga un alias.
   */
  async syncInbox(myId: string, localPrivateKey: string): Promise<{ senders: string[]; newContacts: string[] }> {
    const packets = await messageApiService.getMessages(myId);
    if (packets.length === 0) {
      return { senders: [], newContacts: [] };
    }

    const receivedFrom = new Set<string>();
    const newContacts = new Set<string>();

    for (const packet of packets) {
      try {
        const rgbaPacket = new Uint8ClampedArray(packet);
        const encryptedPayload = steganographyService.extractPayload(rgbaPacket);
        const decrypted = messageCryptoService.decryptWithPrivateKey(encryptedPayload, localPrivateKey);

        let contactHash = '';
        let plaintext = decrypted;
        let isHandshake = false;
        let senderTs: number | undefined;

        try {
          const envelope = JSON.parse(decrypted) as { from: string; pk?: string; text: string; type?: string; ts?: number };
          contactHash = envelope.from;
          plaintext = envelope.text;
          isHandshake = envelope.type === 'handshake';
          if (typeof envelope.ts === 'number') senderTs = envelope.ts;
          if (envelope.pk && contactHash) {
            const existing = await databaseService.getContactPublicKey(contactHash);
            if (!existing) {
              await contactsService.saveContact(contactHash, envelope.pk);
              newContacts.add(contactHash);
            }
          }
        } catch {
          // payload sin envoltorio: compatibilidad con versiones anteriores
        }

        // Los handshakes sólo sirven para intercambiar identidad; no se guardan en el historial
        if (isHandshake) continue;

        if (contactHash) receivedFrom.add(contactHash);
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
    const stegoPacket = steganographyService.embedPayload(this.createDefaultCoverImage(), encryptedPayload, { addNoisePadding: true });

    await messageApiService.sendMessage(recipientId, stegoPacket);
  }

  private createDefaultCoverImage(): Uint8ClampedArray {
    const width = 64;
    const height = 64;
    const rgba = new Uint8ClampedArray(width * height * 4);

    for (let i = 0; i < rgba.length; i += 4) {
      rgba[i] = 90;
      rgba[i + 1] = 130;
      rgba[i + 2] = 180;
      rgba[i + 3] = 255;
    }

    return rgba;
  }
}

export const messageFlowService = new MessageFlowService();
