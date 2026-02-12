package com.hermnet.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTO for sending a secure message.
 * 
 * @param recipientId The ID of the user to receive the message.
 * @param stegoImage  The steganographic image data containing the encrypted
 *                    payload.
 */
public record SendMessageRequest(
        @NotBlank(message = "Recipient ID is required") String recipientId,

        @NotNull(message = "Stego image is required") @Size(min = 1, message = "Stego image cannot be empty") byte[] stegoImage) {
}
