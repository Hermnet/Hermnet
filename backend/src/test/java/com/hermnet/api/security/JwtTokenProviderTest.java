package com.hermnet.api.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class JwtTokenProviderTest {

    private static final String SECRET = "test-secret-test-secret-test-secret-test-secret";

    private JwtTokenProvider provider;

    @BeforeEach
    void setUp() {
        provider = new JwtTokenProvider();
        ReflectionTestUtils.setField(provider, "jwtSecret", SECRET);
        ReflectionTestUtils.setField(provider, "jwtExpirationMinutes", 15L);
    }

    @Test
    void validateConfig_ShouldAcceptStrongSecret() {
        provider.validateConfig();
    }

    @Test
    void validateConfig_ShouldRejectMissingSecret() {
        ReflectionTestUtils.setField(provider, "jwtSecret", " ");

        assertThrows(IllegalStateException.class, provider::validateConfig);
    }

    @Test
    void validateConfig_ShouldRejectShortSecret() {
        ReflectionTestUtils.setField(provider, "jwtSecret", "short");

        assertThrows(IllegalStateException.class, provider::validateConfig);
    }

    @Test
    void tokenHelpers_ShouldRoundTripSubjectAndJti() {
        String token = provider.generateToken("HNET-USER", "jti-test");

        assertTrue(provider.validateToken(token));
        assertEquals("HNET-USER", provider.getUserIdFromToken(token));
        assertEquals("jti-test", provider.getJtiFromToken(token));
        assertEquals(15L, provider.getExpirationMinutes());
    }

    @Test
    void validateToken_ShouldReturnFalse_WhenTokenInvalid() {
        assertFalse(provider.validateToken("not-a-jwt"));
    }
}
