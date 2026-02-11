package com.hermnet.api.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Tracks API usage for rate limiting purposes using a simplified Token Bucket
 * algorithm.
 * 
 * Each record represents the current consumption state for a specific IP
 * address (hashed).
 * This prevents abuse of the platform by limiting the number of requests a
 * client can make
 * within a specific time window.
 */
@Entity
@Table(name = "rate_limit_buckets")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RateLimitBucket {

    /**
     * The hashed IP address of the client.
     * Used as the key for identifying the rate limit bucket.
     */
    @Id
    @Column(name = "ip_hash", length = 64)
    private String ipHash;

    /**
     * The number of requests made in the current window.
     */
    @Column(name = "request_count", nullable = false)
    @Builder.Default
    private int requestCount = 0;

    /**
     * The time when the current rate limit window resets.
     */
    @Column(name = "reset_time", nullable = false)
    private LocalDateTime resetTime;

    /**
     * Checks if the current rate limit window has expired.
     * 
     * @return true if the window has passed and counters should reset
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(resetTime);
    }
}
