package com.hermnet.api.controller;

import com.hermnet.api.dto.RegisterRequest;
import com.hermnet.api.dto.UserResponse;
import com.hermnet.api.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleBadRequests(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}