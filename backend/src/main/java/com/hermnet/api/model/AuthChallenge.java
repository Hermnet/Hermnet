package com.hermnet.api.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Represents an authentication challenge for user login.
 * 
 * This mechanism prevents replay attacks by issuing a temporary, random nonce
 * that the client must sign with their private key. The server verifies the
 * signature
 * against the stored public key to authenticate the session.
 */
@Entity
@Table(name = "auth_challenges")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AuthChallenge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "challenge_id")
    private Long challengeId;

    /**
     * The random cryptographic nonce to be signed by the client.
     */
    @Column(name = "nonce", nullable = false, length = 64)
    private String nonce;

    /**
     * The user associated with this challenge.
     * 
     * Foreign key constraint linking to the user's ID hash.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_hash", referencedColumnName = "id_hash", nullable = false)
    private User userHash;

    /**
     * The timestamp when this challenge expires.
     */
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    /**
     * Checks if the challenge has expired.
     * 
     * @return true if the current time is after the expiration time, false
     *         otherwise.
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
}
