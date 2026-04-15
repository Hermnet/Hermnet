package com.hermnet.api.controller;

import com.hermnet.api.dto.ChallengeRequest;
import com.hermnet.api.dto.ChallengeResponse;
import com.hermnet.api.dto.LoginRequest;
import com.hermnet.api.dto.LoginResponse;
import com.hermnet.api.dto.RegisterRequest;
import com.hermnet.api.dto.UserResponse;
import com.hermnet.api.service.AuthService;
import com.hermnet.api.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for authentication-related endpoints.
 * 
 * Handles user registration and initial authentication steps.
 * Validates incoming requests before delegating to the UserService.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final AuthService authService;

    /**
     * Registers a new user.
     *
     * Validates the request body and creates a new user via the UserService.
     * Returns 201 Created with the new user's details on success.
     *
     * @param request The registration request containing ID and public key.
     * @return ResponseEntity with the created UserResponse.
     */
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        UserResponse response = userService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Creates a one-time nonce challenge for a user.
     *
     * @param request The challenge request containing the user ID.
     * @return ResponseEntity with nonce challenge payload.
     */
    @PostMapping("/challenge")
    public ResponseEntity<ChallengeResponse> challenge(@Valid @RequestBody ChallengeRequest request) {
        ChallengeResponse response = authService.challenge(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Completes the zero-knowledge login flow.
     * 
     * Receives a signed nonce, validates it against the stored user public key and,
     * if valid, returns a short-lived JWT access token.
     *
     * @param request The login request containing the nonce and its signature.
     * @return ResponseEntity with the generated JWT token.
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Rotates the caller's JWT. The current token (sent via Authorization header)
     * is revoked and a freshly issued token is returned.
     *
     * @param authorizationHeader Current "Bearer ..." header.
     * @return ResponseEntity with the rotated JWT token.
     */
    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorizationHeader) {
        String token = stripBearer(authorizationHeader);
        LoginResponse response = authService.refresh(token);
        return ResponseEntity.ok(response);
    }

    /**
     * Revokes the caller's JWT so subsequent requests with it are rejected.
     *
     * @param authorizationHeader Current "Bearer ..." header.
     * @return 204 No Content.
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorizationHeader) {
        authService.logout(stripBearer(authorizationHeader));
        return ResponseEntity.noContent().build();
    }

    private String stripBearer(String header) {
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7).trim();
        }
        return header;
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleBadRequests(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}