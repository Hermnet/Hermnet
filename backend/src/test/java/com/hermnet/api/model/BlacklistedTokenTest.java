package com.hermnet.api.model;

import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for BlacklistedToken entity.
 * 
 * Verifies builder functionality, expiration logic, and field getters/setters.
 */
public class BlacklistedTokenTest {

    @Test
    public void testBuilder() {
        String jti = "test-jti-123";
        String reason = "LOGOUT";
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(30);

        BlacklistedToken token = BlacklistedToken.builder()
                .jti(jti)
                .revokedReason(reason)
                .expiresAt(expiry)
                .build();

        assertEquals(jti, token.getJti());
        assertEquals(reason, token.getRevokedReason());
        assertEquals(expiry, token.getExpiresAt());
    }

    @Test
    public void testIsExpired_WhenExpired_ShouldReturnTrue() {
        BlacklistedToken token = new BlacklistedToken();
        token.setExpiresAt(LocalDateTime.now().minusSeconds(1));

        boolean isExpired = token.isExpired();

        assertTrue(isExpired, "Token should be considered expired");
    }

    @Test
    public void testIsExpired_WhenNotExpired_ShouldReturnFalse() {
        BlacklistedToken token = new BlacklistedToken();
        token.setExpiresAt(LocalDateTime.now().plusSeconds(60));

        boolean isExpired = token.isExpired();

        assertFalse(isExpired, "Token should not be expired yet");
    }

    @Test
    public void testNoArgsConstructor() {
        BlacklistedToken token = new BlacklistedToken();

        assertNotNull(token);
        assertNull(token.getJti());
    }

    @Test
    public void testAllArgsConstructor() {
        String jti = "jti-001";
        String reason = "EXPLICIT";
        LocalDateTime now = LocalDateTime.now();

        BlacklistedToken token = new BlacklistedToken(jti, reason, now);

        assertEquals(jti, token.getJti());
        assertEquals(reason, token.getRevokedReason());
        assertEquals(now, token.getExpiresAt());
    }
}
