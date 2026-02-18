package com.hermnet.api.config;

import com.hermnet.api.model.RateLimitBucket;
import com.hermnet.api.repository.RateLimitBucketRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.LocalDateTime;

/**
 * Security filter that actively defends against brute-force and abuse by
 * enforcing a per-client request rate limit.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitBucketRepository rateLimitBucketRepository;
    private final int maxRequestsPerWindow;
    private final Duration windowDuration;

    public RateLimitFilter(
            RateLimitBucketRepository rateLimitBucketRepository,
            @Value("${app.security.rate-limit.max-requests-per-window:60}") int maxRequestsPerWindow,
            @Value("${app.security.rate-limit.window-seconds:60}") long windowSeconds) {
        this.rateLimitBucketRepository = rateLimitBucketRepository;
        this.maxRequestsPerWindow = maxRequestsPerWindow > 0 ? maxRequestsPerWindow : 60;
        long safeWindowSeconds = windowSeconds > 0 ? windowSeconds : 60;
        this.windowDuration = Duration.ofSeconds(safeWindowSeconds);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String clientId = resolveClientId(request);
        LocalDateTime now = LocalDateTime.now();

        RateLimitBucket bucket = rateLimitBucketRepository.findById(clientId)
                .orElseGet(() -> RateLimitBucket.builder()
                        .ipHash(clientId)
                        .requestCount(0)
                        .resetTime(now.plus(windowDuration))
                        .build());

        if (bucket.getResetTime() == null || !now.isBefore(bucket.getResetTime())) {
            bucket.setRequestCount(0);
            bucket.setResetTime(now.plus(windowDuration));
        }

        bucket.setRequestCount(bucket.getRequestCount() + 1);
        rateLimitBucketRepository.save(bucket);

        if (bucket.getRequestCount() > maxRequestsPerWindow) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"message\":\"Too Many Requests\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String resolveClientId(HttpServletRequest request) {
        Object clientIdAttribute = request.getAttribute("CLIENT_ID");
        if (clientIdAttribute instanceof String clientId && !clientId.isBlank()) {
            return clientId;
        }

        return IpHasher.hash(request.getRemoteAddr());
    }
}