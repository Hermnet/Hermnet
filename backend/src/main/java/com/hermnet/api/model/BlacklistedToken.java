package com.hermnet.api.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Represents a JWT token that has been explicitly invalidated before its
 * expiration.
 * 
 * Token blacklisting is used for:
 * - User logout
 * - Password resets
 * - Account suspension
 * - Security breach mitigation
 */
@Entity
@Table(name = "token_blacklist")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BlacklistedToken {

    /**
     * The unique JWT ID (JTI) claim from the token.
     */
    @Id
    @Column(length = 36, name = "jti")
    private String jti;

    /**
     * The reason why this token was blacklisted (e.g., "LOGOUT", "SECURITY").
     */
    @Column(name = "revoked_reason", length = 20)
    private String revokedReason;

    /**
     * The original expiration time of the token.
     * Records can be safely deleted after this time as the token would be invalid
     * anyway.
     */
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    /**
     * Checks if the token's original validity period has passed.
     * 
     * @return true if the token would be expired regardless of blacklisting
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
}
