package com.hermnet.api.dto;

/**
 * DTO for the authentication challenge response.
 * 
 * @param nonce The random cryptographic nonce that the client must sign.
 */
public record ChallengeResponse(
        String nonce) {
}
