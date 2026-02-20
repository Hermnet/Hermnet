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
        User user = new User();
        user.setIdHash("test-user-hash");
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(5);
        String nonce = "random-nonce-123";

        AuthChallenge challenge = AuthChallenge.builder()
                .nonce(nonce)
                .userHash(user)
                .expiresAt(expiry)
                .build();

        assertEquals(nonce, challenge.getNonce());
        assertEquals(user, challenge.getUserHash());
        assertEquals(expiry, challenge.getExpiresAt());
        assertNull(challenge.getChallengeId(), "ID should be null before persistence");
    }

    @Test
    public void testIsExpired_WhenExpired_ShouldReturnTrue() {
        AuthChallenge challenge = new AuthChallenge();
        challenge.setExpiresAt(LocalDateTime.now().minusSeconds(1)); 

        boolean isExpired = challenge.isExpired();

        assertTrue(isExpired, "Challenge should be expired");
    }

    @Test
    public void testIsExpired_WhenNotExpired_ShouldReturnFalse() {
        AuthChallenge challenge = new AuthChallenge();
        challenge.setExpiresAt(LocalDateTime.now().plusSeconds(60)); 

        boolean isExpired = challenge.isExpired();

        assertFalse(isExpired, "Challenge should not be expired yet");
    }

    @Test
    public void testNoArgsConstructor() {
        AuthChallenge challenge = new AuthChallenge();

        assertNotNull(challenge);
        assertNull(challenge.getNonce());
        assertNull(challenge.getUserHash());
    }

    @Test
    public void testAllArgsConstructor() {
        Long id = 100L;
        User user = new User();
        LocalDateTime now = LocalDateTime.now();
        String nonce = "nonce-val";

        AuthChallenge challenge = new AuthChallenge(id, nonce, user, now);

        assertEquals(id, challenge.getChallengeId());
        assertEquals(nonce, challenge.getNonce());
        assertEquals(user, challenge.getUserHash());
        assertEquals(now, challenge.getExpiresAt());
    }

    @Test
    public void testSetters() {
        AuthChallenge challenge = new AuthChallenge();
        User user = new User();

        challenge.setNonce("new-nonce");
        challenge.setUserHash(user);

        assertEquals("new-nonce", challenge.getNonce());
        assertEquals(user, challenge.getUserHash());
    }
}
