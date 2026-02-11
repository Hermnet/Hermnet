package com.hermnet.api.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Represents a secure, encrypted message stored in the mailbox.
 * 
 * Messages in Hermnet contain a steganographic payload ("stego packet").
 * The server stores this opaque blob without knowing its content.
 * Routing is handled via a hashed recipient ID to preserve anonymity.
 * 
 * Note: The sender's identity is NOT stored on the server to ensure
 * plausible deniability and minimize metadata leakage.
 */
@Entity
@Table(name = "mailbox", indexes = { @Index(name = "idx_mailbox_recipient", columnList = "recipient_hash") })
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "message_id")
    private Long messageId;

    /**
     * The hashed ID of the recipient.
     * 
     * Users subscribe to a topic/mailbox corresponding to this hash to receive
     * messages.
     * Hashing ensures that even if the DB is compromised, linking real user IDs
     * to mailboxes is computationally expensive.
     */
    @Column(name = "recipient_hash", length = 64, nullable = false)
    private String recipientHash;

    /**
     * The steganographic data packet containing the encrypted message.
     * 
     * This blob typically contains an image or data structure where the actual
     * encrypted message is hidden. The server treats this as opaque data.
     */
    @Lob
    @Column(name = "stego_packet", nullable = false)
    private byte[] stegoPacket;

    /**
     * Timestamp when the message was received by the server.
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Automatically sets the creation timestamp before persisting.
     */
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
