package com.hermnet.api.dto;

import java.time.LocalDateTime;

/**
 * DTO for user response data.
 * 
 * Represents the public user information returned after successful operations
 * like registration or retrieval. Excludes sensitive internal data.
 *
 * @param id        The unique identifier of the user (ID Hash).
 * @param publicKey The user's public encryption key.
 * @param createdAt The timestamp when the user was registered.
 */
public record UserResponse(
        String id,
        String publicKey,
        LocalDateTime createdAt) {
}