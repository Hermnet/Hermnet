package com.hermnet.api.service;

import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.SecureRandom;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

import org.springframework.stereotype.Service;

import com.hermnet.api.dto.ChallengeRequest;
import com.hermnet.api.dto.ChallengeResponse;
import com.hermnet.api.dto.LoginRequest;
import com.hermnet.api.dto.LoginResponse;
import com.hermnet.api.model.AuthChallenge;
import com.hermnet.api.model.User;
import com.hermnet.api.repository.AuthChallengeRepository;
import com.hermnet.api.repository.UserRepository;

import lombok.RequiredArgsConstructor;

/**
 * Service responsible for zero-knowledge login flow.
 *
 * Validates a signed nonce against the stored user public key and, if valid,
 * issues a short-lived JWT access token.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthChallengeRepository authChallengeRepository;
    private final UserRepository userRepository;
    private final com.hermnet.api.security.JwtTokenProvider jwtTokenProvider;
    private static final int CHALLENGE_EXPIRATION_SECONDS = 30;

    /**
     * Generates a one-time challenge nonce for the requested user.
     *
     * @param request Request containing user identifier.
     * @return ChallengeResponse with nonce to be signed by the client.
     */
    public ChallengeResponse challenge(ChallengeRequest request) {
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        authChallengeRepository.deleteByUserHash(user);

        String nonce = generateNonce();
        AuthChallenge challenge = AuthChallenge.builder()
                .nonce(nonce)
                .userHash(user)
                .expiresAt(LocalDateTime.now().plusSeconds(CHALLENGE_EXPIRATION_SECONDS))
                .build();

        authChallengeRepository.save(challenge);
        return new ChallengeResponse(nonce);
    }

    /**
     * Completes the login process by validating a signed nonce and returning a JWT.
     *
     * @param request The login request containing the nonce and its signature.
     * @return A LoginResponse containing the JWT token.
     * @throws IllegalArgumentException if the nonce is invalid, expired or the
     *                                  signature does not match.
     */
    public LoginResponse login(LoginRequest request) {
        AuthChallenge challenge = authChallengeRepository.findByNonce(request.nonce())
                .orElseThrow(() -> new IllegalArgumentException("Nonce inválido o inexistente"));

        if (challenge.isExpired()) {
            authChallengeRepository.delete(challenge);
            throw new IllegalArgumentException("El nonce ha expirado");
        }

        User user = challenge.getUserHash();

        if (!verifySignature(user.getPublicKey(), request.nonce(), request.signedNonce())) {
            throw new IllegalArgumentException("Firma no válida");
        }

        // One-time use: remove challenge to prevent replay attacks
        authChallengeRepository.delete(challenge);

        String token = jwtTokenProvider.generateToken(user.getIdHash());
        return new LoginResponse(token);
    }

    private boolean verifySignature(String publicKeyString, String nonce, String signedNonceBase64) {
        try {
            PublicKey publicKey = parsePublicKey(publicKeyString);
            byte[] signatureBytes = Base64.getDecoder().decode(signedNonceBase64);

            Signature verifier = Signature.getInstance("SHA256withRSA");
            verifier.initVerify(publicKey);
            verifier.update(nonce.getBytes(StandardCharsets.UTF_8));

            return verifier.verify(signatureBytes);
        } catch (Exception e) {
            return false;
        }
    }

    private PublicKey parsePublicKey(String publicKeyString) throws Exception {
        String sanitized = publicKeyString
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s", "");

        byte[] decoded = Base64.getDecoder().decode(sanitized);
        X509EncodedKeySpec keySpec = new X509EncodedKeySpec(decoded);
        return KeyFactory.getInstance("RSA").generatePublic(keySpec);
    }

    private String generateNonce() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

}

