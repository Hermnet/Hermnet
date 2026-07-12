package com.hermnet.api.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Security filter that defends against brute-force and abuse by enforcing a
 * per-client, fixed-window request rate limit.
 *
 * <p>Counters live entirely in memory. This removes the per-request database
 * round-trip that a persistent counter would require (the hot path is every
 * single API call) and, crucially, makes the increment atomic: the previous
 * database-backed implementation did a read-modify-write that could lose
 * updates under concurrency and let a client exceed the limit. Here the window
 * is created atomically via {@link ConcurrentHashMap#compute} and the counter
 * is an {@link AtomicInteger}, so concurrent requests from the same client are
 * counted exactly.</p>
 *
 * <p>Rate-limit state is inherently ephemeral, so keeping it out of PostgreSQL
 * is also the correct data model. A scheduled sweep evicts stale windows to
 * keep memory bounded.</p>
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final int maxRequestsPerWindow;
    private final long windowMillis;
    private final ConcurrentHashMap<String, Window> buckets = new ConcurrentHashMap<>();

    /**
     * A single fixed window for one client: a monotonic hit counter plus the
     * wall-clock instant at which the window expires and must be recreated.
     */
    private static final class Window {
        final AtomicInteger count = new AtomicInteger(0);
        final long resetAtMillis;

        Window(long resetAtMillis) {
            this.resetAtMillis = resetAtMillis;
        }
    }

    /**
     * Builds the filter with in-memory counters and safe defaults when the
     * configured values are invalid.
     *
     * @param maxRequestsPerWindow maximum requests allowed in one window
     * @param windowSeconds        rate-limit window length in seconds
     */
    public RateLimitFilter(
            @Value("${app.security.rate-limit.max-requests-per-window:60}") int maxRequestsPerWindow,
            @Value("${app.security.rate-limit.window-seconds:60}") long windowSeconds) {
        this.maxRequestsPerWindow = maxRequestsPerWindow > 0 ? maxRequestsPerWindow : 60;
        long safeWindowSeconds = windowSeconds > 0 ? windowSeconds : 60;
        this.windowMillis = safeWindowSeconds * 1000L;
    }

    /**
     * Applies the rate limit before protected controller code executes.
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String clientId = resolveClientId(request);
        long now = System.currentTimeMillis();

        // Atomically fetch the live window or start a fresh one if it is missing
        // or expired. compute() runs its remapping under the map's per-key lock,
        // so exactly one thread creates the replacement window; the rest observe
        // the new one. No lost updates, no read-modify-write race.
        Window window = buckets.compute(clientId, (key, existing) ->
                (existing == null || now >= existing.resetAtMillis)
                        ? new Window(now + windowMillis)
                        : existing);

        int count = window.count.incrementAndGet();

        if (count > maxRequestsPerWindow) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"message\":\"Too Many Requests\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Periodically drops windows whose reset instant has already passed so the
     * map does not grow without bound as clients come and go. Only expired
     * windows are removed; a window is expired precisely when it would be
     * recreated on the next request, so eviction never discards live counters.
     */
    @Scheduled(fixedDelayString = "${app.security.rate-limit.eviction-ms:300000}")
    void evictStaleWindows() {
        long now = System.currentTimeMillis();
        buckets.values().removeIf(window -> now >= window.resetAtMillis);
    }

    private String resolveClientId(HttpServletRequest request) {
        Object clientIdAttribute = request.getAttribute("CLIENT_ID");
        if (clientIdAttribute instanceof String clientId && !clientId.isBlank()) {
            return clientId;
        }

        return IpHasher.hash(request.getRemoteAddr());
    }
}
