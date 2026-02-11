package com.hermnet.api.config;

import org.springframework.util.DigestUtils;

import java.nio.charset.StandardCharsets;

public class IpHasher {
    private static final String SALT = "HERMNET_SECRET_SALT_2025";

    public static String hash(String ip) {
        if (ip == null) return "unknown";
        String saltedIp = ip + SALT;
        return DigestUtils.md5DigestAsHex(saltedIp.getBytes(StandardCharsets.UTF_8));
    }
}
