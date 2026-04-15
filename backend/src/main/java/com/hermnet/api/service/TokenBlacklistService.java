package com.hermnet.api.service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;

import org.springframework.stereotype.Service;

import com.hermnet.api.model.BlacklistedToken;
import com.hermnet.api.repository.BlacklistedTokenRepository;

import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;

/**
 * Manages explicitly revoked JWTs so their jti can no longer authenticate
 * requests before they reach natural expiration.
 */
@Service
@RequiredArgsConstructor
public class TokenBlacklistService {

    private final BlacklistedTokenRepository repository;

    public void revoke(Claims claims, String reason) {
        String jti = claims.getId();
        Date expiration = claims.getExpiration();
        if (jti == null || expiration == null) {
            return;
        }
        if (repository.existsById(jti)) {
            return;
        }
        LocalDateTime expiresAt = Instant.ofEpochMilli(expiration.getTime())
                .atZone(ZoneId.systemDefault())
                .toLocalDateTime();
        repository.save(BlacklistedToken.builder()
                .jti(jti)
                .revokedReason(reason)
                .expiresAt(expiresAt)
                .build());
    }

    public boolean isBlacklisted(String jti) {
        if (jti == null) {
            return false;
        }
        return repository.existsById(jti);
    }
}
