package com.hermnet.api.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SendMessageRequestTest {

    private static Validator validator;

    @BeforeAll
    static void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void shouldPassValidation_WhenRequestIsValid() {
        SendMessageRequest request = new SendMessageRequest("recipient-123", new byte[] { 1, 2, 3 });
        Set<ConstraintViolation<SendMessageRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty(), "Valid request should not have violations");
    }

    @Test
    void shouldFailValidation_WhenRecipientIdIsBlank() {
        SendMessageRequest request = new SendMessageRequest("", new byte[] { 1, 2, 3 });
        Set<ConstraintViolation<SendMessageRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty(), "Blank recipient ID should fail validation");
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Recipient ID is required")));
    }

    @Test
    void shouldFailValidation_WhenRecipientIdIsNull() {
        SendMessageRequest request = new SendMessageRequest(null, new byte[] { 1, 2, 3 });
        Set<ConstraintViolation<SendMessageRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty(), "Null recipient ID should fail validation");
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Recipient ID is required")));
    }

    @Test
    void shouldFailValidation_WhenStegoImageIsNull() {
        SendMessageRequest request = new SendMessageRequest("recipient-123", null);
        Set<ConstraintViolation<SendMessageRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty(), "Null stego image should fail validation");
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Stego image is required")));
    }

    @Test
    void shouldFailValidation_WhenStegoImageIsEmpty() {
        SendMessageRequest request = new SendMessageRequest("recipient-123", new byte[] {});
        Set<ConstraintViolation<SendMessageRequest>> violations = validator.validate(request);
        assertFalse(violations.isEmpty(), "Empty stego image should fail validation");
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Stego image cannot be empty")));
    }
}
