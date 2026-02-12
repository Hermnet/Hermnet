package com.hermnet.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * DTO for user registration requests.
 * 
 * Encapsulates the necessary data to register a new user in the system.
 * Includes validation annotations to enforce data integrity constraints
 * such as mandatory fields and ID format patterns.
 *
 * @param id        The unique identifier for the user. Must start with "HNET-"
 *                  followed by at least 5 alphanumeric characters.
 * @param publicKey The user's public encryption key. Must not be blank.
 * @param pushToken Optional push notification token for the user.
 */
public record RegisterRequest(
        @NotBlank(message = "El ID es obligatorio") @Pattern(regexp = "^HNET-[A-Za-z0-9]{5,}$", message = "El ID debe empezar por HNET- y tener caracteres alfanuméricos") String id,

        @NotBlank(message = "La clave pública es obligatoria") String publicKey,

        String pushToken // Opcional
) {
}