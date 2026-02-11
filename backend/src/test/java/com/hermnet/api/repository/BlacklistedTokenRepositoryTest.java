package com.hermnet.api.repository;

import com.hermnet.api.model.BlacklistedToken;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for BlacklistedTokenRepository.
 * 
 * Verifies storing and checking existence of blacklisted tokens.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
public class BlacklistedTokenRepositoryTest {

    @Autowired
    private BlacklistedTokenRepository tokenRepository;

    private static final String JTI = "test-token-id-123";

    @BeforeEach
    public void setUp() {
        tokenRepository.deleteAll();
    }

    @Test
    public void testSaveAndCheckExists() {
        // Given
        BlacklistedToken token = BlacklistedToken.builder()
                .jti(JTI)
                .revokedReason("LOGOUT")
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .build();

        // When
        tokenRepository.save(token);

        // Then
        assertTrue(tokenRepository.existsById(JTI), "Token should exist in blacklist");
        assertFalse(tokenRepository.existsById("NON-EXISTENT"), "Random token should not exist");
    }

    @Test
    public void testFindById_ShouldRetrieveReason() {
        // Given
        String reason = "SECURITY";
        BlacklistedToken token = BlacklistedToken.builder()
                .jti(JTI)
                .revokedReason(reason)
                .expiresAt(LocalDateTime.now())
                .build();
        tokenRepository.save(token);

        // When
        Optional<BlacklistedToken> found = tokenRepository.findById(JTI);

        // Then
        assertTrue(found.isPresent());
        assertEquals(reason, found.get().getRevokedReason());
    }

    @Test
    public void testDeleteById() {
        // Given
        BlacklistedToken token = new BlacklistedToken(JTI, "TEST", LocalDateTime.now());
        tokenRepository.save(token);
        assertTrue(tokenRepository.existsById(JTI));

        // When
        tokenRepository.deleteById(JTI);

        // Then
        assertFalse(tokenRepository.existsById(JTI), "Token should be removed from blacklist");
    }
}
