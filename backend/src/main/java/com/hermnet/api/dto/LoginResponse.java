package com.hermnet.api.dto;

/**
 * DTO for zero-knowledge login responses.
 *
 * @param token The signed JWT access token.
 */
public record LoginResponse(
        String token) {
}

