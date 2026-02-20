package com.hermnet.api.config;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class IpHasherTest {

    @Test
    public void testIpHashingIsConsistentWithinSameDay() {
        String ip = "192.168.1.1";
        String hash1 = IpHasher.hash(ip);
        String hash2 = IpHasher.hash(ip);

        assertEquals(hash1, hash2, "The same IP must generate the same hash today");

        assertNotEquals(ip, hash1, "The hash must be different from the original IP");
    }

    @Test
    public void testHashIsSHA256() {
        String ip = "192.168.1.1";
        String hash = IpHasher.hash(ip);
        
        assertEquals(64, hash.length(), "The hash must be a SHA-256 string (64 chars)");
    }

    @Test
    public void testDifferentIpsProduceDifferentHashes() {
        String ip1 = "192.168.1.1";
        String ip2 = "192.168.1.2";

        String hash1 = IpHasher.hash(ip1);
        String hash2 = IpHasher.hash(ip2);

        assertNotEquals(hash1, hash2, "Different IPs must generate different hashes");
    }

    @Test
    public void testNullIpHandling() {
        String hash = IpHasher.hash(null);

        assertEquals("unknown", hash, "A null IP must return 'unknown'");
    }
}
