package com.hermnet.api.config;

import com.hermnet.api.model.RateLimitBucket;
import com.hermnet.api.repository.RateLimitBucketRepository;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RateLimitFilterTest {

    @Mock
    private RateLimitBucketRepository rateLimitBucketRepository;

    @Mock
    private FilterChain filterChain;

    private RateLimitFilter rateLimitFilter;

    @BeforeEach
    void setUp() {
        rateLimitFilter = new RateLimitFilter(rateLimitBucketRepository, 60, 60);
    }

    @Test
    void shouldAllowRequestWhenLimitNotExceeded() throws Exception {
        String clientId = "client-hash";
        RateLimitBucket existingBucket = RateLimitBucket.builder()
                .ipHash(clientId)
                .requestCount(5)
                .resetTime(LocalDateTime.now().plusSeconds(30))
                .build();

        when(rateLimitBucketRepository.findById(clientId)).thenReturn(Optional.of(existingBucket));
        when(rateLimitBucketRepository.save(any(RateLimitBucket.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute("CLIENT_ID", clientId);
        MockHttpServletResponse response = new MockHttpServletResponse();

        rateLimitFilter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verify(rateLimitBucketRepository).save(existingBucket);
    }

    @Test
    void shouldBlockRequestWhenLimitExceeded() throws Exception {
        String clientId = "client-hash";
        RateLimitBucket existingBucket = RateLimitBucket.builder()
                .ipHash(clientId)
                .requestCount(60)
                .resetTime(LocalDateTime.now().plusSeconds(30))
                .build();

        when(rateLimitBucketRepository.findById(clientId)).thenReturn(Optional.of(existingBucket));
        when(rateLimitBucketRepository.save(any(RateLimitBucket.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute("CLIENT_ID", clientId);
        MockHttpServletResponse response = new MockHttpServletResponse();

        rateLimitFilter.doFilter(request, response, filterChain);

        verify(filterChain, never()).doFilter(request, response);
        verify(rateLimitBucketRepository).save(existingBucket);
        assertTrue(response.getStatus() == 429);
    }

    @Test
    void shouldResetExpiredBucketWindow() throws Exception {
        String clientId = "client-hash";
        RateLimitBucket expiredBucket = RateLimitBucket.builder()
                .ipHash(clientId)
                .requestCount(120)
                .resetTime(LocalDateTime.now().minusSeconds(5))
                .build();

        when(rateLimitBucketRepository.findById(clientId)).thenReturn(Optional.of(expiredBucket));
        when(rateLimitBucketRepository.save(any(RateLimitBucket.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute("CLIENT_ID", clientId);
        MockHttpServletResponse response = new MockHttpServletResponse();

        rateLimitFilter.doFilter(request, response, filterChain);

        ArgumentCaptor<RateLimitBucket> captor = ArgumentCaptor.forClass(RateLimitBucket.class);
        verify(rateLimitBucketRepository).save(captor.capture());
        RateLimitBucket savedBucket = captor.getValue();

        verify(filterChain).doFilter(request, response);
        assertTrue(savedBucket.getRequestCount() == 1);
        assertTrue(savedBucket.getResetTime().isAfter(LocalDateTime.now().plusSeconds(55)));
    }
}