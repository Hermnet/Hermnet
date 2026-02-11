package com.hermnet.api.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Represents a secure, encrypted message stored in the mailbox.
 * 
 * Messages in Hermnet are end-to-end encrypted. The server only stores the
 * encrypted blob (byte array) and metadata necessary for routing (recipient ID)
 * and sender verification (sender ID hash), but never the plaintext content.
 */
@Entity
@Table(name = "mailbox")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The ID of the user who will receive this message.
     * This field is used for routing the message to the correct mailbox.
     */
    @Column(name = "recipient_id", length = 64, nullable = false)
    private String recipientId;

    /**
     * A hash of the sender's ID.
     * 
     * The sender's ID is hashed to prevent the server from easily mapping
     * communication patterns (who is talking to whom) while still allowing
     * basic rate limiting or blocking if needed.
     */
    @Column(name = "sender_id_hash", length = 64, nullable = false)
    private String senderIdHash;

    /**
     * The encrypted content of the message.
     * 
     * This binary large object (BLOB) contains the image/message encrypted
     * with the recipient's public key. The server cannot decrypt this.
     */
    @Lob
    @Column(name = "stego_packet", nullable = false)
    private byte[] encryptedImage;

    /**
     * Timestamp when the message was received by the server.
     */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /**
     * Automatically sets the creation timestamp before persisting.
     */
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
