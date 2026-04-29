package com.hermnet.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTO for sending a secure message.
 *
 * @param recipientId The ID of the user to receive the message.
 * @param payload     Opaque encrypted payload (hybrid AES-GCM + RSA-OAEP). The
 *                    server never decodes it.
 */
public record SendMessageRequest(
        @NotBlank(message = "Recipient ID is required") String recipientId,

        @NotNull(message = "Payload is required") @Size(min = 1, message = "Payload cannot be empty") byte[] payload) {
}
