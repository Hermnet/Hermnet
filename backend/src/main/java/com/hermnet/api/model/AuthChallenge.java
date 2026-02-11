package com.hermnet.api.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Represents an authentication challenge for user login.
 * 
 * This entity stores a temporary challenge string (nonce) linked to a specific
 * user.
 * The user must sign this challenge with their private key to prove their
 * identity.
 * Challenges have an expiration time to prevent replay attacks.
 */
@Entity
@Table(name = "auth_challenges")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AuthChallenge {

    /**
     * The unique challenge string (nonce).
     * Used as the Primary Key.
     */
    @Id
    private String challenge;

    /**
     * The user associated with this challenge.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

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
