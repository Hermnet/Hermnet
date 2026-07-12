package com.hermnet.api.config;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class RateLimitFilterTest {

    @Mock
    private FilterChain filterChain;

    private RateLimitFilter rateLimitFilter;

    @BeforeEach
    void setUp() {
        // 5 requests per 60s window keeps the tests fast and explicit.
        rateLimitFilter = new RateLimitFilter(5, 60);
    }

    private MockHttpServletRequest requestFor(String clientId) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute("CLIENT_ID", clientId);
        return request;
    }

    private void hit(String clientId, MockHttpServletResponse response) throws Exception {
        rateLimitFilter.doFilter(requestFor(clientId), response, filterChain);
    }

    @Test
    void shouldAllowRequestsUpToTheLimit() throws Exception {
        for (int i = 0; i < 5; i++) {
            hit("client-a", new MockHttpServletResponse());
        }
        verify(filterChain, times(5)).doFilter(any(), any());
    }

    @Test
    void shouldBlockRequestOnceLimitExceeded() throws Exception {
        for (int i = 0; i < 5; i++) {
            hit("client-b", new MockHttpServletResponse());
        }
        MockHttpServletResponse blocked = new MockHttpServletResponse();

        hit("client-b", blocked);

        assertEquals(429, blocked.getStatus());
        // The 6th request must not reach the chain.
        verify(filterChain, times(5)).doFilter(any(), any());
    }

    @Test
    void shouldCountClientsIndependently() throws Exception {
        for (int i = 0; i < 5; i++) {
            hit("client-c", new MockHttpServletResponse());
        }
        MockHttpServletResponse otherClient = new MockHttpServletResponse();

        hit("client-d", otherClient);

        // A different client has its own fresh window and is allowed through.
        assertEquals(200, otherClient.getStatus());
        verify(filterChain, times(6)).doFilter(any(), any());
    }

    @Test
    void evictionRemovesExpiredWindowsButKeepsLiveOnes() throws Exception {
        // Exhaust client-e so its window is at the limit and still live.
        for (int i = 0; i < 5; i++) {
            hit("client-e", new MockHttpServletResponse());
        }

        // A live window (reset in the future) must survive eviction, so the
        // client stays blocked immediately afterwards.
        rateLimitFilter.evictStaleWindows();

        MockHttpServletResponse afterEviction = new MockHttpServletResponse();
        hit("client-e", afterEviction);
        assertEquals(429, afterEviction.getStatus());
    }

    @Test
    void shouldFallBackToHashedIpWhenNoClientIdAttribute() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.0.2");
        MockHttpServletResponse response = new MockHttpServletResponse();

        rateLimitFilter.doFilter(request, response, filterChain);

        assertEquals(200, response.getStatus());
        verify(filterChain, times(1)).doFilter(any(), any());
    }

    @Test
    void shouldUseSafeDefaultsWhenConfiguredWithInvalidValues() throws Exception {
        // maxRequests=0 must fall back to 60, so a handful of requests all pass.
        rateLimitFilter = new RateLimitFilter(0, 0);
        for (int i = 0; i < 10; i++) {
            hit("client-f", new MockHttpServletResponse());
        }
        verify(filterChain, times(10)).doFilter(any(), any());
    }
}
