package com.hermnet.api.model;

import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for RateLimitBucket entity.
 * 
 * Verifies builder functionality, expiration logic, and default values.
 */
public class RateLimitBucketTest {

    @Test
    public void testBuilder() {
        // Given
        String ipHash = "hash-127.0.0.1";
        LocalDateTime resetTime = LocalDateTime.now().plusMinutes(1);
        int requestCount = 5;

        // When
        RateLimitBucket bucket = RateLimitBucket.builder()
                .ipHash(ipHash)
                .requestCount(requestCount)
                .resetTime(resetTime)
                .build();

        // Then
        assertEquals(ipHash, bucket.getIpHash());
        assertEquals(requestCount, bucket.getRequestCount());
        assertEquals(resetTime, bucket.getResetTime());
    }

    @Test
    public void testBuilder_DefaultRequestCount() {
        // Given - Building without specifying requestCount
        RateLimitBucket bucket = RateLimitBucket.builder()
                .ipHash("hash-prod")
                .resetTime(LocalDateTime.now())
                .build();

        // Then
        assertEquals(0, bucket.getRequestCount(), "Default request count should be 0");
    }

    @Test
    public void testIsExpired_WhenExpired_ShouldReturnTrue() {
        // Given
        RateLimitBucket bucket = new RateLimitBucket();
        bucket.setResetTime(LocalDateTime.now().minusSeconds(1));

        // When
        boolean isExpired = bucket.isExpired();

        // Then
        assertTrue(isExpired, "Bucket window should be expired");
    }

    @Test
    public void testIsExpired_WhenNotExpired_ShouldReturnFalse() {
        // Given
        RateLimitBucket bucket = new RateLimitBucket();
        bucket.setResetTime(LocalDateTime.now().plusSeconds(60));

        // When
        boolean isExpired = bucket.isExpired();

        // Then
        assertFalse(isExpired, "Bucket window should not be expired yet");
    }

    @Test
    public void testSetters() {
        // Given
        RateLimitBucket bucket = new RateLimitBucket();

        // When
        bucket.setRequestCount(10);

        // Then
        assertEquals(10, bucket.getRequestCount());
    }
}
