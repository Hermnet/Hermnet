package com.hermnet.api.config;

import org.springframework.util.DigestUtils;

import java.nio.charset.StandardCharsets;

/**
 * Utility class for hashing IP addresses to ensure user privacy.
 * 
 * This class provides a static method to convert IP addresses into anonymized
 * hashes
 * using MD5 with a salt. This allows tracking unique users without storing
 * their
 * actual IP addresses, complying with privacy regulations like GDPR.
 */
public class IpHasher {
    // Secret salt used to enhance hash security and prevent rainbow table attacks
    private static final String SALT = "HERMNET_SECRET_SALT_2025";

    /**
     * Hashes an IP address using MD5 with a predefined salt.
     * 
     * @param ip The IP address to hash (can be IPv4 or IPv6)
     * @return A hexadecimal string representing the hashed IP, or "unknown" if ip
     *         is null
     */
    public static String hash(String ip) {
        // Handle null IP addresses gracefully
        if (ip == null)
            return "unknown";

        // Combine IP with salt to create a unique, non-reversible identifier
        String saltedIp = ip + SALT;

        // Generate MD5 hash and return as hexadecimal string
        return DigestUtils.md5DigestAsHex(saltedIp.getBytes(StandardCharsets.UTF_8));
    }
}
