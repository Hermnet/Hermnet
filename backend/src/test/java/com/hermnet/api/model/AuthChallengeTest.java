package com.hermnet.api.model;

import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for AuthChallenge entity.
 * 
 * Verifies builder functionality, expiration logic, and relationships.
 * Updated to reflect: challengeId (Long), nonce (String), userHash (User).
 */
public class AuthChallengeTest {

    @Test
    public void testBuilder() {
        // Given
        User user = new User();
        user.setIdHash("test-user-hash");
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(5);
        String nonce = "random-nonce-123";

        // When
        AuthChallenge challenge = AuthChallenge.builder()
                .nonce(nonce)
                .userHash(user)
                .expiresAt(expiry)
                .build();

        // Then
        assertEquals(nonce, challenge.getNonce());
        assertEquals(user, challenge.getUserHash());
        assertEquals(expiry, challenge.getExpiresAt());
        assertNull(challenge.getChallengeId(), "ID should be null before persistence");
    }

    @Test
    public void testIsExpired_WhenExpired_ShouldReturnTrue() {
        // Given
        AuthChallenge challenge = new AuthChallenge();
        challenge.setExpiresAt(LocalDateTime.now().minusSeconds(1)); // Expired 1 second ago

        // When
        boolean isExpired = challenge.isExpired();

        // Then
        assertTrue(isExpired, "Challenge should be expired");
    }

    @Test
    public void testIsExpired_WhenNotExpired_ShouldReturnFalse() {
        // Given
        AuthChallenge challenge = new AuthChallenge();
        challenge.setExpiresAt(LocalDateTime.now().plusSeconds(60)); // Expires in 60 seconds

        // When
        boolean isExpired = challenge.isExpired();

        // Then
        assertFalse(isExpired, "Challenge should not be expired yet");
    }

    @Test
    public void testNoArgsConstructor() {
        // When
        AuthChallenge challenge = new AuthChallenge();

        // Then
        assertNotNull(challenge);
        assertNull(challenge.getNonce());
        assertNull(challenge.getUserHash());
    }

    @Test
    public void testAllArgsConstructor() {
        // Given
        Long id = 100L;
        User user = new User();
        LocalDateTime now = LocalDateTime.now();
        String nonce = "nonce-val";

        // When
        AuthChallenge challenge = new AuthChallenge(id, nonce, user, now);

        // Then
        assertEquals(id, challenge.getChallengeId());
        assertEquals(nonce, challenge.getNonce());
        assertEquals(user, challenge.getUserHash());
        assertEquals(now, challenge.getExpiresAt());
    }

    @Test
    public void testSetters() {
        // Given
        AuthChallenge challenge = new AuthChallenge();
        User user = new User();

        // When
        challenge.setNonce("new-nonce");
        challenge.setUserHash(user);

        // Then
        assertEquals("new-nonce", challenge.getNonce());
        assertEquals(user, challenge.getUserHash());
    }
}
