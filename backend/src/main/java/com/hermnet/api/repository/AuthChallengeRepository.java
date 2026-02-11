package com.hermnet.api.repository;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hermnet.api.model.AuthChallenge;
import com.hermnet.api.model.User;

/**
 * Repository interface for AuthChallenge entity operations.
 * 
 * Provides methods to store, retrieve, and delete authentication challenges
 * (nonces).
 */
public interface AuthChallengeRepository extends JpaRepository<AuthChallenge, Long> {

    /**
     * Finds a challenge by its nonce string.
     * 
     * @param nonce The unique nonce string
     * @return An Optional containing the challenge if found
     */
    Optional<AuthChallenge> findByNonce(String nonce);

    /**
     * Deletes all challenges associated with a specific user.
     * 
     * @param user The user entity (mapped to user_hash)
     */
    void deleteByUserHash(User user);

    /**
     * Deletes all challenges that have expired before the given time.
     * 
     * @param expiryDate The cutoff date/time
     */
    void deleteByExpiresAtBefore(LocalDateTime expiryDate);
}
