package com.hermnet.api.config;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.util.HexFormat;

/**
 * Utility class for hashing IP addresses to ensure user privacy.
 * 
 * This class provides a static method to convert IP addresses into anonymized
 * hashes using SHA-256 with a dynamic daily salt.
 * 
 * Key Features:
 * - SHA-256: Stronger cryptographic hash than MD5.
 * - Daily Rotation: The salt changes every day (based on LocalDate), meaning
 * the same IP will have a different hash tomorrow. This prevents long-term
 * tracking of users across days, enhancing privacy compliance (GDPR).
 */
public class IpHasher {

    // Base secret combined with the date to form the daily salt
    private static final String BASE_SECRET = "HERMNET_SECRET_SALT_2025";

    /**
     * Hashes an IP address using SHA-256 and a daily rotating salt.
     * 
     * @param ip The IP address to hash
     * @return A hexadecimal string representing the hashed IP (SHA-256), or
     *         "unknown" if ip is null.
     */
    public static String hash(String ip) {
        if (ip == null)
            return "unknown";

        try {
            // Create a salt that changes every day to prevent long-term tracking
            String dailySalt = BASE_SECRET + LocalDate.now().toString();
            String input = ip + dailySalt;

            // Use SHA-256 for better security
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedHash = digest.digest(input.getBytes(StandardCharsets.UTF_8));

            // Return the hash as a hex string
            return HexFormat.of().formatHex(encodedHash);
        } catch (Exception e) {
            // Runtime exception is preferred here as this should fundamentally not fail in
            // a healthy JVM
            throw new RuntimeException("Error hashing IP address", e);
        }
    }

}
