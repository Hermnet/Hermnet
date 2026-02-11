package com.hermnet.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hermnet.api.model.BlacklistedToken;

/**
 * Repository for managing blacklisted (revoked) JWT tokens.
 */
@Repository
public interface BlacklistedTokenRepository extends JpaRepository<BlacklistedToken, String> {

    /**
     * Checks if a token ID (JTI) is in the blacklist.
     * 
     * Note: Changed from existsByTokenHash to existsById (or standard JPA query)
     * because the entity ID is 'jti'. Since 'jti' is the primary key,
     * we can use JpaRepository's standard existsById, or if 'tokenHash' refers
     * to something else, we need to clarify.
     * 
     * Assuming 'tokenHash' in your intent meant checking the JTI (which is the ID).
     * However, the method signature you provided was `existsByTokenHash`.
     * The entity `BlacklistedToken` does NOT have a field `tokenHash`. It has
     * `jti`.
     * 
     * I will assume you meant to check by JTI.
     */
    // boolean existsByTokenHash(String tokenHash); // This would fail because
    // tokenHash field doesn't exist
    // The main method is actually handled by JpaRepository.existsById(String jti)
}
