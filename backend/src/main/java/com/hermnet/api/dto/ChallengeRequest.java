package com.hermnet.api.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO for initiating an authentication challenge.
 * 
 * @param userId The unique ID of the user attempting to authenticate.
 */
public record ChallengeRequest(
        @NotBlank(message = "User ID is required") String userId) {
}
