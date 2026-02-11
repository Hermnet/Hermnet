package com.hermnet.api.repository;

import com.hermnet.api.model.AuthChallenge;
import com.hermnet.api.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for AuthChallengeRepository.
 * 
 * Verifies storing, retrieving, deleting challenges (by user, by expiry), and
 * custom query methods.
 * Updated to reflect schema: ID=Long, nonce=String, user=userHash.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
public class AuthChallengeRepositoryTest {

    @Autowired
    private AuthChallengeRepository challengeRepository;

    @Autowired
    private UserRepository userRepository;

    private User testUser;
    private static final String NONCE_VAL = "random-nonce-123";

    @BeforeEach
    public void setUp() {
        challengeRepository.deleteAll();
        userRepository.deleteAll();

        // Create a test user
        testUser = User.builder()
                .idHash("HNET-AUTH-USER")
                .publicKey("some-auth-key")
                .build();
        userRepository.save(testUser);
    }

    @Test
    public void testSaveAndFindChallenge() {
        // Given
        AuthChallenge challenge = AuthChallenge.builder()
                .nonce(NONCE_VAL)
                .userHash(testUser)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .build();

        // When
        AuthChallenge saved = challengeRepository.save(challenge);

        // Then
        assertNotNull(saved.getChallengeId());

        // Find by ID
        Optional<AuthChallenge> found = challengeRepository.findById(saved.getChallengeId());
        assertTrue(found.isPresent(), "Should find saved challenge by ID");
        assertEquals(NONCE_VAL, found.get().getNonce());
        assertEquals(testUser.getIdHash(), found.get().getUserHash().getIdHash());

        // Find by Nonce (custom method)
        Optional<AuthChallenge> foundByNonce = challengeRepository.findByNonce(NONCE_VAL);
        assertTrue(foundByNonce.isPresent(), "Should find saved challenge by Nonce");
        assertEquals(saved.getChallengeId(), foundByNonce.get().getChallengeId());
    }

    @Test
    public void testDeleteByUserHash() {
        // Given - Create multiple challenges for the same user
        AuthChallenge c1 = AuthChallenge.builder()
                .nonce("nonce1")
                .userHash(testUser)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .build();
        AuthChallenge c2 = AuthChallenge.builder()
                .nonce("nonce2")
                .userHash(testUser)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .build();
        challengeRepository.saveAll(List.of(c1, c2));

        // And create a challenge for another user to ensure it's not deleted
        User otherUser = User.builder().idHash("HNET-OTHER").publicKey("other-key").build();
        userRepository.save(otherUser);

        AuthChallenge c3 = AuthChallenge.builder()
                .nonce("nonce3")
                .userHash(otherUser)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .build();
        challengeRepository.save(c3);

        assertEquals(3, challengeRepository.count(), "Should have 3 challenges initially");

        // When - Delete challenges for the first user
        challengeRepository.deleteByUserHash(testUser);

        // Then
        assertEquals(1, challengeRepository.count(), "Should have 1 challenge remaining");
        Optional<AuthChallenge> remaining = challengeRepository.findByNonce("nonce3");
        assertTrue(remaining.isPresent(), "Other user's challenge should persist");
        assertEquals("HNET-OTHER", remaining.get().getUserHash().getIdHash());
    }

    @Test
    public void testDeleteByUserHash_WhenNoChallengesExist_ShouldNotThrowException() {
        // When/Then
        assertDoesNotThrow(() -> challengeRepository.deleteByUserHash(testUser));
    }

    @Test
    public void testDeleteByExpiresAtBefore() {
        // Given - Create challenges with specific expiry times
        LocalDateTime now = LocalDateTime.now();

        // Expired 1 hour ago
        AuthChallenge expired = AuthChallenge.builder()
                .nonce("expired")
                .userHash(testUser)
                .expiresAt(now.minusHours(1))
                .build();

        // Expires 1 hour in future
        AuthChallenge active = AuthChallenge.builder()
                .nonce("active")
                .userHash(testUser)
                .expiresAt(now.plusHours(1))
                .build();

        challengeRepository.saveAll(List.of(expired, active));

        // When - Delete challenges older than current time
        // Note: deleteByExpiresAtBefore(cutoff) removes entries where expiresAt <
        // cutoff

        challengeRepository.deleteByExpiresAtBefore(now);

        // Then
        List<AuthChallenge> remaining = challengeRepository.findAll();
        assertEquals(1, remaining.size());
        assertEquals("active", remaining.get(0).getNonce());
    }
}
