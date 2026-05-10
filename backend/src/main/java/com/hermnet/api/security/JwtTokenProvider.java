package com.hermnet.api.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;
import java.util.function.Function;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;

/**
 * Creates, validates and parses Hermnet access tokens.
 *
 * Tokens are signed with HS256 and include both the authenticated user id
 * (subject) and a unique JTI so refresh/logout can revoke individual tokens.
 */
@Component
public class JwtTokenProvider {

    private static final int MIN_SECRET_BYTES = 32;

    @Value("${jwt.secret:}")
    private String jwtSecret;

    @Value("${jwt.expiration.minutes:15}")
    private long jwtExpirationMinutes;

    @PostConstruct
    void validateConfig() {
        if (jwtSecret == null || jwtSecret.isBlank()) {
            throw new IllegalStateException(
                    "jwt.secret no está configurado. Defínelo en application.properties o como variable de entorno JWT_SECRET.");
        }
        if (jwtSecret.getBytes(StandardCharsets.UTF_8).length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "jwt.secret es demasiado corto: HS256 requiere al menos " + MIN_SECRET_BYTES + " bytes.");
        }
    }

    /**
     * Generates a token with a random JTI for normal login and refresh flows.
     *
     * @param userId authenticated user id to store as the JWT subject
     * @return signed compact JWT
     */
    public String generateToken(String userId) {
        return generateToken(userId, UUID.randomUUID().toString());
    }

    /**
     * Generates a token with an explicit JTI.
     *
     * @param userId authenticated user id to store as the JWT subject
     * @param jti    unique token identifier used for revocation
     * @return signed compact JWT
     */
    public String generateToken(String userId, String jti) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .id(jti)
                .subject(userId)
                .issuedAt(new Date(now))
                .expiration(new Date(now + jwtExpirationMinutes * 60 * 1000))
                .signWith(getSigningKey(), Jwts.SIG.HS256)
                .compact();
    }

    /**
     * Returns the configured access-token lifetime in minutes.
     *
     * @return token lifetime in minutes
     */
    public long getExpirationMinutes() {
        return jwtExpirationMinutes;
    }

    /**
     * Parses and verifies a JWT, returning its claims when the signature and
     * expiration are valid.
     *
     * @param token compact JWT
     * @return verified claims
     */
    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Checks whether a JWT can be parsed and verified.
     *
     * @param token compact JWT
     * @return true when the token is structurally valid, signed and not expired
     */
    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Extracts the authenticated user id from a valid token.
     *
     * @param token compact JWT
     * @return JWT subject
     */
    public String getUserIdFromToken(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Extracts the token id used by the blacklist service.
     *
     * @param token compact JWT
     * @return JWT ID claim
     */
    public String getJtiFromToken(String token) {
        return extractClaim(token, Claims::getId);
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        return claimsResolver.apply(parseClaims(token));
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }
}
