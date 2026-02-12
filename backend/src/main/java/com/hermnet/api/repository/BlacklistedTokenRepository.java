package com.hermnet.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hermnet.api.model.BlacklistedToken;

/**
 * Repository for managing blacklisted (revoked) JWT tokens.
 */
@Repository
public interface BlacklistedTokenRepository extends JpaRepository<BlacklistedToken, String> {

}
