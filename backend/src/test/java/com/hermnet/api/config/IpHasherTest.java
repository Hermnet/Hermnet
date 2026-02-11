package com.hermnet.api.config;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class IpHasherTest {

    @Test
    public void testIpHashingIsConsistent() {
        String ip = "192.168.1.1";
        String hash1 = IpHasher.hash(ip);
        String hash2 = IpHasher.hash(ip);

        // The same IP must produce the same hash
        assertEquals(hash1, hash2, "The same IP must generate the same hash");

        // The hash must not be equal to the original IP (must be anonymized)
        assertNotEquals(ip, hash1, "The hash must be different from the original IP");
    }

    @Test
    public void testDifferentIpsProduceDifferentHashes() {
        String ip1 = "192.168.1.1";
        String ip2 = "192.168.1.2";

        String hash1 = IpHasher.hash(ip1);
        String hash2 = IpHasher.hash(ip2);

        // Different IPs must produce different hashes
        assertNotEquals(hash1, hash2, "Different IPs must generate different hashes");
    }

    @Test
    public void testNullIpHandling() {
        String hash = IpHasher.hash(null);

        // A null IP must return "unknown"
        assertEquals("unknown", hash, "A null IP must return 'unknown'");
    }
}
