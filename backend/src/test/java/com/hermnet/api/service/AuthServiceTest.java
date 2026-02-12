package com.hermnet.api.service;

import com.hermnet.api.dto.LoginRequest;
import com.hermnet.api.dto.LoginResponse;
import com.hermnet.api.model.AuthChallenge;
import com.hermnet.api.model.User;
import com.hermnet.api.repository.AuthChallengeRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.charset.StandardCharsets;
import java.security.*;
import java.util.Base64;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthChallengeRepository authChallengeRepository;

    @Mock
    private com.hermnet.api.security.JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private AuthService authService;

    private KeyPair keyPair;
    private String publicKeyString;
    private User user;
    private AuthChallenge challenge;
    private String nonce;

    @BeforeEach
    void setUp() throws NoSuchAlgorithmException {
        // Generate RSA Key Pair for testing
        KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
        keyGen.initialize(2048);
        keyPair = keyGen.generateKeyPair();

        // Format public key as stored in DB (Base64 encoded)
        publicKeyString = Base64.getEncoder().encodeToString(keyPair.getPublic().getEncoded());

        user = User.builder()
                .idHash("USER-HASH-123")
                .publicKey(publicKeyString)
                .build();

        nonce = "test-nonce-12345";

        challenge = AuthChallenge.builder()
                .nonce(nonce)
                .userHash(user)
                .expiresAt(java.time.LocalDateTime.now().plusMinutes(5))
                .build();
    }

    @Test
    void login_ShouldReturnToken_WhenSignatureIsValid() throws Exception {
        // Sign the nonce with the private key
        Signature signer = Signature.getInstance("SHA256withRSA");
        signer.initSign(keyPair.getPrivate());
        signer.update(nonce.getBytes(StandardCharsets.UTF_8));
        byte[] signatureBytes = signer.sign();
        String signedNonce = Base64.getEncoder().encodeToString(signatureBytes);

        LoginRequest request = new LoginRequest(nonce, signedNonce);

        when(authChallengeRepository.findByNonce(nonce)).thenReturn(Optional.of(challenge));
        when(jwtTokenProvider.generateToken(anyString())).thenReturn("mock-jwt-token");

        // Execute
        LoginResponse response = authService.login(request);

        // Verify
        assertNotNull(response);
        assertEquals("mock-jwt-token", response.token());
        verify(authChallengeRepository).delete(challenge); // Should delete used challenge
    }

    @Test
    void login_ShouldThrowException_WhenNonceNotFound() {
        LoginRequest request = new LoginRequest("invalid-nonce", "some-signature");
        when(authChallengeRepository.findByNonce("invalid-nonce")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> authService.login(request));
    }

    @Test
    void login_ShouldThrowException_WhenChallengeExpired() {
        // Create expired challenge
        AuthChallenge expiredChallenge = AuthChallenge.builder()
                .nonce(nonce)
                .userHash(user)
                .expiresAt(java.time.LocalDateTime.now().minusMinutes(10)) // Expired
                .build();

        when(authChallengeRepository.findByNonce(nonce)).thenReturn(Optional.of(expiredChallenge));

        LoginRequest request = new LoginRequest(nonce, "signature");

        assertThrows(IllegalArgumentException.class, () -> authService.login(request));
        verify(authChallengeRepository).delete(expiredChallenge); // Should delete expired challenge
    }

    @Test
    void login_ShouldThrowException_WhenSignatureIsInvalid() throws Exception {
        // Create invalid signature
        String invalidSignature = Base64.getEncoder().encodeToString("invalid-signature".getBytes());
        LoginRequest request = new LoginRequest(nonce, invalidSignature);

        when(authChallengeRepository.findByNonce(nonce)).thenReturn(Optional.of(challenge));

        assertThrows(IllegalArgumentException.class, () -> authService.login(request));
        verify(authChallengeRepository, never()).delete(challenge); // Should NOT delete challenge if signature fails
                                                                    // (maybe? The code doesn't delete on sig fail
                                                                    // usually to prevent brute force? Wait, code check:
                                                                    // line 65 is after verify. So correct.)
    }

    @Test
    void login_ShouldThrowException_WhenPublicKeyIsInvalid() {
        // User with malformed public key
        User userBadKey = User.builder()
                .idHash("USER-BAD")
                .publicKey("not-a-valid-key")
                .build();

        AuthChallenge challengeBadKey = AuthChallenge.builder()
                .nonce(nonce)
                .userHash(userBadKey)
                .expiresAt(java.time.LocalDateTime.now().plusMinutes(5))
                .build();

        when(authChallengeRepository.findByNonce(nonce)).thenReturn(Optional.of(challengeBadKey));

        LoginRequest request = new LoginRequest(nonce, "any-signature");

        assertThrows(IllegalArgumentException.class, () -> authService.login(request));
    }
}
