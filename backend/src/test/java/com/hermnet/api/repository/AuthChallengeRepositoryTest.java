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


        testUser = User.builder()
                .idHash("HNET-AUTH-USER")
                .publicKey("some-auth-key")
                .build();
        userRepository.save(testUser);
    }

    @Test
    public void testSaveAndFindChallenge() {

        AuthChallenge challenge = AuthChallenge.builder()
                .nonce(NONCE_VAL)
                .userHash(testUser)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .build();


        AuthChallenge saved = challengeRepository.save(challenge);


        assertNotNull(saved.getChallengeId());


        Optional<AuthChallenge> found = challengeRepository.findById(saved.getChallengeId());
        assertTrue(found.isPresent(), "Should find saved challenge by ID");
        assertEquals(NONCE_VAL, found.get().getNonce());
        assertEquals(testUser.getIdHash(), found.get().getUserHash().getIdHash());


        Optional<AuthChallenge> foundByNonce = challengeRepository.findByNonce(NONCE_VAL);
        assertTrue(foundByNonce.isPresent(), "Should find saved challenge by Nonce");
        assertEquals(saved.getChallengeId(), foundByNonce.get().getChallengeId());
    }

    @Test
    public void testDeleteByUserHash() {

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


        User otherUser = User.builder().idHash("HNET-OTHER").publicKey("other-key").build();
        userRepository.save(otherUser);

        AuthChallenge c3 = AuthChallenge.builder()
                .nonce("nonce3")
                .userHash(otherUser)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .build();
        challengeRepository.save(c3);

        assertEquals(3, challengeRepository.count(), "Should have 3 challenges initially");


        challengeRepository.deleteByUserHash(testUser);


        assertEquals(1, challengeRepository.count(), "Should have 1 challenge remaining");
        Optional<AuthChallenge> remaining = challengeRepository.findByNonce("nonce3");
        assertTrue(remaining.isPresent(), "Other user's challenge should persist");
        assertEquals("HNET-OTHER", remaining.get().getUserHash().getIdHash());
    }

    @Test
    public void testDeleteByUserHash_WhenNoChallengesExist_ShouldNotThrowException() {

        assertDoesNotThrow(() -> challengeRepository.deleteByUserHash(testUser));
    }

    @Test
    public void testDeleteByExpiresAtBefore() {

        LocalDateTime now = LocalDateTime.now();


        AuthChallenge expired = AuthChallenge.builder()
                .nonce("expired")
                .userHash(testUser)
                .expiresAt(now.minusHours(1))
                .build();


        AuthChallenge active = AuthChallenge.builder()
                .nonce("active")
                .userHash(testUser)
                .expiresAt(now.plusHours(1))
                .build();

        challengeRepository.saveAll(List.of(expired, active));





        challengeRepository.deleteByExpiresAtBefore(now);


        List<AuthChallenge> remaining = challengeRepository.findAll();
        assertEquals(1, remaining.size());
        assertEquals("active", remaining.get(0).getNonce());
    }
}
