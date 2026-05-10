package com.hermnet.api.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import com.hermnet.api.security.JwtAuthenticationFilter;

class SecurityConfigTest {

    @Test
    void corsConfigurationSource_ShouldApplyAllowedOrigins_WhenConfigured() {
        SecurityConfig config = new SecurityConfig(
                mock(IpAnonymizationFilter.class),
                mock(RateLimitFilter.class),
                mock(JwtAuthenticationFilter.class));
        ReflectionTestUtils.setField(config, "allowedOrigins", "http://localhost:8081,https://hermnet.app");

        CorsConfigurationSource source = config.corsConfigurationSource();
        CorsConfiguration cors = source.getCorsConfiguration(new MockHttpServletRequest("GET", "/api/messages"));

        assertEquals(List.of("http://localhost:8081", "https://hermnet.app"), cors.getAllowedOrigins());
        assertTrue(cors.getAllowedMethods().contains("POST"));
        assertTrue(cors.getAllowedHeaders().contains("Authorization"));
        assertEquals(List.of("Authorization"), cors.getExposedHeaders());
        assertEquals(Boolean.TRUE, cors.getAllowCredentials());
        assertEquals(3600L, cors.getMaxAge());
    }
}
