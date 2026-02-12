package com.hermnet.api.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO for zero-knowledge login requests.
 *
 * @param nonce       The random nonce issued in the previous challenge step.
 * @param signedNonce The cryptographic signature of the nonce, created with the client's private key.
 */
public record LoginRequest(
        @NotBlank(message = "Nonce is required") String nonce,
        @NotBlank(message = "Signed nonce is required") String signedNonce) {
}

