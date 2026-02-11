package com.hermnet.api.model;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for the User entity.
 * 
 * Tests cover:
 * - Builder pattern functionality
 * - Getter and setter methods (idHash, publicKey, pushToken)
 * - PrePersist lifecycle callback
 * - Field validation and constraints
 * - Edge cases and null handling
 */
public class UserTest {

    private User user;

    @BeforeEach
    public void setUp() {
        // Initialize a fresh User instance before each test
        user = new User();
    }

    @Test
    public void testUserBuilder_ShouldCreateUserWithAllFields() {
        // Given
        String expectedIdHash = "AB123456HASH";
        String expectedPublicKey = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ...";
        String expectedPushToken = "push-token-123";
        LocalDateTime expectedCreatedAt = LocalDateTime.now();

        // When
        User builtUser = User.builder()
                .idHash(expectedIdHash)
                .publicKey(expectedPublicKey)
                .pushToken(expectedPushToken)
                .createdAt(expectedCreatedAt)
                .build();

        // Then
        assertNotNull(builtUser, "Built user should not be null");
        assertEquals(expectedIdHash, builtUser.getIdHash(), "User ID Hash should match");
        assertEquals(expectedPublicKey, builtUser.getPublicKey(), "Public key should match");
        assertEquals(expectedPushToken, builtUser.getPushToken(), "Push token should match");
        assertEquals(expectedCreatedAt, builtUser.getCreatedAt(), "Created at should match");
    }

    @Test
    public void testUserBuilder_WithMinimalFields() {
        // Given
        String expectedIdHash = "MIN-HASH-001";
        String expectedPublicKey = "minimal-key";

        // When
        User builtUser = User.builder()
                .idHash(expectedIdHash)
                .publicKey(expectedPublicKey)
                .build();

        // Then
        assertNotNull(builtUser, "Built user should not be null");
        assertEquals(expectedIdHash, builtUser.getIdHash(), "User ID Hash should match");
        assertEquals(expectedPublicKey, builtUser.getPublicKey(), "Public key should match");
        assertNull(builtUser.getPushToken(), "Push token should be null when not set");
        assertNull(builtUser.getCreatedAt(), "Created at should be null when not set in builder");
    }

    @Test
    public void testNoArgsConstructor_ShouldCreateEmptyUser() {
        // When
        User emptyUser = new User();

        // Then
        assertNotNull(emptyUser, "User created with no-args constructor should not be null");
        assertNull(emptyUser.getIdHash(), "ID hash should be null");
        assertNull(emptyUser.getPublicKey(), "Public key should be null");
        assertNull(emptyUser.getCreatedAt(), "Created at should be null");
    }

    @Test
    public void testAllArgsConstructor_ShouldCreateUserWithAllFields() {
        // Given
        String expectedIdHash = "ALL-AGS-HASH";
        String expectedPublicKey = "all-args-key";
        String expectedPushToken = "push-token";
        LocalDateTime expectedCreatedAt = LocalDateTime.now();

        // When
        User allArgsUser = new User(expectedIdHash, expectedPublicKey, expectedPushToken, expectedCreatedAt);

        // Then
        assertNotNull(allArgsUser, "User created with all-args constructor should not be null");
        assertEquals(expectedIdHash, allArgsUser.getIdHash());
        assertEquals(expectedPublicKey, allArgsUser.getPublicKey());
        assertEquals(expectedPushToken, allArgsUser.getPushToken());
        assertEquals(expectedCreatedAt, allArgsUser.getCreatedAt());
    }

    @Test
    public void testSettersAndGetters_ShouldWorkCorrectly() {
        // Given
        String expectedIdHash = "SETTER-HASH";
        String expectedPublicKey = "setter-test-key";
        String expectedPushToken = "setter-token";
        LocalDateTime expectedCreatedAt = LocalDateTime.now();

        // When
        user.setIdHash(expectedIdHash);
        user.setPublicKey(expectedPublicKey);
        user.setPushToken(expectedPushToken);
        user.setCreatedAt(expectedCreatedAt);

        // Then
        assertEquals(expectedIdHash, user.getIdHash());
        assertEquals(expectedPublicKey, user.getPublicKey());
        assertEquals(expectedPushToken, user.getPushToken());
        assertEquals(expectedCreatedAt, user.getCreatedAt());
    }

    @Test
    public void testSetIdHash_WithNullValue() {
        // When
        user.setIdHash(null);

        // Then
        assertNull(user.getIdHash(), "ID Hash should be null when set to null");
    }

    @Test
    public void testSetIdHash_WithMaxLength() {
        // Given - ID column is defined with length 64
        String maxLengthId = "H".repeat(64);

        // When
        user.setIdHash(maxLengthId);

        // Then
        assertEquals(maxLengthId, user.getIdHash());
        assertEquals(64, user.getIdHash().length());
    }

    @Test
    public void testPrePersist_ShouldSetCreatedAtAutomatically() {
        // Given
        User newUser = User.builder()
                .idHash("PERSIST-HASH")
                .publicKey("persist-test-key")
                .build();

        // Verify createdAt is null before @PrePersist
        assertNull(newUser.getCreatedAt(), "Created at should be null before persistence");

        // When - Manually invoke the @PrePersist method
        newUser.onCreate();

        // Then
        assertNotNull(newUser.getCreatedAt(), "Created at should be set after @PrePersist");
    }
}
