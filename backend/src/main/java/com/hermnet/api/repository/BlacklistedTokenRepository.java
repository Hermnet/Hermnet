package com.hermnet.api.repository;

import java.time.LocalDateTime;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hermnet.api.model.BlacklistedToken;

/**
 * Repository for managing blacklisted (revoked) JWT tokens.
 */
@Repository
public interface BlacklistedTokenRepository extends JpaRepository<BlacklistedToken, String> {

	/**
	 * Deletes all blacklisted tokens whose expiration time has passed.
	 *
	 * @param expiryDate the cutoff timestamp; tokens with expiresAt before this
	 *                   date are removed
	 */
	void deleteByExpiresAtBefore(LocalDateTime expiryDate);

}
