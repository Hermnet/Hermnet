package com.hermnet.api.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Date;
import java.util.HashMap;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.hermnet.api.model.BlacklistedToken;
import com.hermnet.api.repository.BlacklistedTokenRepository;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.impl.DefaultClaims;

@ExtendWith(MockitoExtension.class)
class TokenBlacklistServiceTest {

    @Mock
    private BlacklistedTokenRepository repository;

    @InjectMocks
    private TokenBlacklistService service;

    private Claims claimsWith(String jti, Date exp) {
        HashMap<String, Object> map = new HashMap<>();
        if (jti != null) map.put(Claims.ID, jti);
        if (exp != null) map.put(Claims.EXPIRATION, exp.getTime() / 1000L);
        return new DefaultClaims(map);
    }

    @Test
    void isBlacklisted_ReturnsFalse_WhenJtiNull() {
        assertFalse(service.isBlacklisted(null));
        verify(repository, never()).existsById(any());
    }

    @Test
    void isBlacklisted_DelegatesToRepository() {
        when(repository.existsById("jti-1")).thenReturn(true);
        assertTrue(service.isBlacklisted("jti-1"));
    }

    @Test
    void revoke_SavesBlacklistedToken_WhenNotAlreadyPresent() {
        Date exp = new Date(System.currentTimeMillis() + 60_000);
        Claims claims = claimsWith("jti-xyz", exp);
        when(repository.existsById("jti-xyz")).thenReturn(false);

        service.revoke(claims, "LOGOUT");

        verify(repository).save(any(BlacklistedToken.class));
    }

    @Test
    void revoke_Skips_WhenJtiMissing() {
        Claims claims = claimsWith(null, new Date(System.currentTimeMillis() + 60_000));
        service.revoke(claims, "LOGOUT");
        verify(repository, never()).save(any());
    }

    @Test
    void revoke_Skips_WhenAlreadyBlacklisted() {
        Date exp = new Date(System.currentTimeMillis() + 60_000);
        Claims claims = claimsWith("jti-dup", exp);
        when(repository.existsById("jti-dup")).thenReturn(true);

        service.revoke(claims, "REFRESH");

        verify(repository, never()).save(any());
    }
}
