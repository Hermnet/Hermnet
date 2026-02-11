package com.hermnet.api.repository;

import com.hermnet.api.model.RateLimitBucket;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for RateLimitBucketRepository.
 * 
 * Verifies storing and updating request counts for IP tracking.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
public class RateLimitBucketRepositoryTest {

    @Autowired
    private RateLimitBucketRepository bucketRepository;

    private static final String IP_HASH = "ip-hash-abc-123";

    @BeforeEach
    public void setUp() {
        bucketRepository.deleteAll();
    }

    @Test
    public void testSaveAndRetrieveBucket() {
        // Given
        int count = 5;
        RateLimitBucket bucket = RateLimitBucket.builder()
                .ipHash(IP_HASH)
                .requestCount(count)
                .resetTime(LocalDateTime.now().plusMinutes(1))
                .build();

        // When
        bucketRepository.save(bucket);

        // Then
        Optional<RateLimitBucket> found = bucketRepository.findById(IP_HASH);
        assertTrue(found.isPresent(), "Should find rate limit bucket");
        assertEquals(count, found.get().getRequestCount());
        assertEquals(IP_HASH, found.get().getIpHash());
    }

    @Test
    public void testIncrementRequestCount() {
        // Given - Create initial bucket
        RateLimitBucket bucket = new RateLimitBucket(IP_HASH, 0, LocalDateTime.now().plusSeconds(30));
        bucket = bucketRepository.save(bucket);
        assertEquals(0, bucket.getRequestCount());

        // When - Fetch, update count in memory, save back
        RateLimitBucket fetched = bucketRepository.findById(IP_HASH).get();
        fetched.setRequestCount(fetched.getRequestCount() + 1);
        bucketRepository.save(fetched);

        // Then
        RateLimitBucket updated = bucketRepository.findById(IP_HASH).get();
        assertEquals(1, updated.getRequestCount(), "Count should be incremented");
    }

    @Test
    public void testUpdateResetTime() {
        // Given
        LocalDateTime oldReset = LocalDateTime.now().minusMinutes(5);
        bucketRepository.save(new RateLimitBucket(IP_HASH, 100, oldReset));

        // When - Reset due to expiration
        RateLimitBucket expiredBucket = bucketRepository.findById(IP_HASH).get();
        assertTrue(expiredBucket.isExpired(), "Should be expired");

        LocalDateTime newReset = LocalDateTime.now().plusMinutes(1);
        expiredBucket.setResetTime(newReset);
        expiredBucket.setRequestCount(0); // Reset count
        bucketRepository.save(expiredBucket);

        // Then
        RateLimitBucket refreshed = bucketRepository.findById(IP_HASH).get();
        assertEquals(0, refreshed.getRequestCount());
        // Compare epoch millis or use tolerance for time equality if needed,
        // but here checking presence and basic update is enough.
        assertNotNull(refreshed.getResetTime());
        // Simple check that it's in the future
        assertTrue(LocalDateTime.now().isBefore(refreshed.getResetTime()));
    }
}
