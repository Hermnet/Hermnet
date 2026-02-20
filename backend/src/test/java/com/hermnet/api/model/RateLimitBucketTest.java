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
        String ipHash = "hash-127.0.0.1";
        LocalDateTime resetTime = LocalDateTime.now().plusMinutes(1);
        int requestCount = 5;

        RateLimitBucket bucket = RateLimitBucket.builder()
                .ipHash(ipHash)
                .requestCount(requestCount)
                .resetTime(resetTime)
                .build();

        assertEquals(ipHash, bucket.getIpHash());
        assertEquals(requestCount, bucket.getRequestCount());
        assertEquals(resetTime, bucket.getResetTime());
    }

    @Test
    public void testBuilder_DefaultRequestCount() {
        RateLimitBucket bucket = RateLimitBucket.builder()
                .ipHash("hash-prod")
                .resetTime(LocalDateTime.now())
                .build();

        assertEquals(0, bucket.getRequestCount(), "Default request count should be 0");
    }

    @Test
    public void testIsExpired_WhenExpired_ShouldReturnTrue() {

        RateLimitBucket bucket = new RateLimitBucket();
        bucket.setResetTime(LocalDateTime.now().minusSeconds(1));


        boolean isExpired = bucket.isExpired();


        assertTrue(isExpired, "Bucket window should be expired");
    }

    @Test
    public void testIsExpired_WhenNotExpired_ShouldReturnFalse() {

        RateLimitBucket bucket = new RateLimitBucket();
        bucket.setResetTime(LocalDateTime.now().plusSeconds(60));


        boolean isExpired = bucket.isExpired();


        assertFalse(isExpired, "Bucket window should not be expired yet");
    }

    @Test
    public void testSetters() {

        RateLimitBucket bucket = new RateLimitBucket();


        bucket.setRequestCount(10);


        assertEquals(10, bucket.getRequestCount());
    }
}
