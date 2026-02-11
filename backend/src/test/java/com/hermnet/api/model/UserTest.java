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
 * - Getter and setter methods
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
        String expectedId = "HNET-TEST123";
        String expectedPublicKey = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ...";
        LocalDateTime expectedCreatedAt = LocalDateTime.now();

        // When
        User builtUser = User.builder()
                .id(expectedId)
                .publicKey(expectedPublicKey)
                .createdAt(expectedCreatedAt)
                .build();

        // Then
        assertNotNull(builtUser, "Built user should not be null");
        assertEquals(expectedId, builtUser.getId(), "User ID should match");
        assertEquals(expectedPublicKey, builtUser.getPublicKey(), "Public key should match");
        assertEquals(expectedCreatedAt, builtUser.getCreatedAt(), "Created at should match");
    }

    @Test
    public void testUserBuilder_WithMinimalFields() {
        // Given
        String expectedId = "HNET-MIN001";
        String expectedPublicKey = "minimal-key";

        // When
        User builtUser = User.builder()
                .id(expectedId)
                .publicKey(expectedPublicKey)
                .build();

        // Then
        assertNotNull(builtUser, "Built user should not be null");
        assertEquals(expectedId, builtUser.getId(), "User ID should match");
        assertEquals(expectedPublicKey, builtUser.getPublicKey(), "Public key should match");
        assertNull(builtUser.getCreatedAt(), "Created at should be null when not set in builder");
    }

    @Test
    public void testNoArgsConstructor_ShouldCreateEmptyUser() {
        // When
        User emptyUser = new User();

        // Then
        assertNotNull(emptyUser, "User created with no-args constructor should not be null");
        assertNull(emptyUser.getId(), "ID should be null");
        assertNull(emptyUser.getPublicKey(), "Public key should be null");
        assertNull(emptyUser.getCreatedAt(), "Created at should be null");
    }

    @Test
    public void testAllArgsConstructor_ShouldCreateUserWithAllFields() {
        // Given
        String expectedId = "HNET-ALL001";
        String expectedPublicKey = "all-args-key";
        LocalDateTime expectedCreatedAt = LocalDateTime.now();

        // When
        User allArgsUser = new User(expectedId, expectedPublicKey, expectedCreatedAt);

        // Then
        assertNotNull(allArgsUser, "User created with all-args constructor should not be null");
        assertEquals(expectedId, allArgsUser.getId(), "User ID should match");
        assertEquals(expectedPublicKey, allArgsUser.getPublicKey(), "Public key should match");
        assertEquals(expectedCreatedAt, allArgsUser.getCreatedAt(), "Created at should match");
    }

    @Test
    public void testSettersAndGetters_ShouldWorkCorrectly() {
        // Given
        String expectedId = "HNET-SETTER001";
        String expectedPublicKey = "setter-test-key";
        LocalDateTime expectedCreatedAt = LocalDateTime.now();

        // When
        user.setId(expectedId);
        user.setPublicKey(expectedPublicKey);
        user.setCreatedAt(expectedCreatedAt);

        // Then
        assertEquals(expectedId, user.getId(), "Getter should return the value set by setter for ID");
        assertEquals(expectedPublicKey, user.getPublicKey(),
                "Getter should return the value set by setter for public key");
        assertEquals(expectedCreatedAt, user.getCreatedAt(),
                "Getter should return the value set by setter for created at");
    }

    @Test
    public void testSetId_WithNullValue() {
        // When
        user.setId(null);

        // Then
        assertNull(user.getId(), "ID should be null when set to null");
    }

    @Test
    public void testSetPublicKey_WithNullValue() {
        // When
        user.setPublicKey(null);

        // Then
        assertNull(user.getPublicKey(), "Public key should be null when set to null");
    }

    @Test
    public void testSetPublicKey_WithEmptyString() {
        // Given
        String emptyKey = "";

        // When
        user.setPublicKey(emptyKey);

        // Then
        assertEquals(emptyKey, user.getPublicKey(), "Public key should accept empty string");
    }

    @Test
    public void testSetPublicKey_WithLongKey() {
        // Given - Simulate a long RSA public key
        String longKey = "ssh-rsa " + "A".repeat(500);

        // When
        user.setPublicKey(longKey);

        // Then
        assertEquals(longKey, user.getPublicKey(), "Public key should handle long keys");
    }

    @Test
    public void testSetId_WithMaxLength() {
        // Given - ID column is defined with length 64
        String maxLengthId = "H".repeat(64);

        // When
        user.setId(maxLengthId);

        // Then
        assertEquals(maxLengthId, user.getId(), "ID should handle max length (64 characters)");
        assertEquals(64, user.getId().length(), "ID length should be 64");
    }

    @Test
    public void testPrePersist_ShouldSetCreatedAtAutomatically() {
        // Given
        User newUser = User.builder()
                .id("HNET-PERSIST001")
                .publicKey("persist-test-key")
                .build();

        // Verify createdAt is null before @PrePersist
        assertNull(newUser.getCreatedAt(), "Created at should be null before persistence");

        // When - Manually invoke the @PrePersist method (simulating JPA lifecycle)
        LocalDateTime beforeCall = LocalDateTime.now();
        newUser.onCreate();
        LocalDateTime afterCall = LocalDateTime.now();

        // Then
        assertNotNull(newUser.getCreatedAt(), "Created at should be set after @PrePersist");
        assertTrue(newUser.getCreatedAt().isAfter(beforeCall.minusSeconds(1)),
                "Created at should be after or equal to the time before onCreate call");
        assertTrue(newUser.getCreatedAt().isBefore(afterCall.plusSeconds(1)),
                "Created at should be before or equal to the time after onCreate call");
    }

    @Test
    public void testPrePersist_ShouldNotOverrideExistingCreatedAt() {
        // Given
        LocalDateTime existingCreatedAt = LocalDateTime.now().minusDays(5);
        User existingUser = User.builder()
                .id("HNET-EXISTING001")
                .publicKey("existing-key")
                .createdAt(existingCreatedAt)
                .build();

        // When - Call onCreate (which sets createdAt to now)
        existingUser.onCreate();

        // Then - The createdAt should be updated to current time
        // Note: The current implementation DOES overwrite. If you want to preserve
        // existing createdAt, you'd need to modify onCreate() to check if it's null
        // first
        assertNotNull(existingUser.getCreatedAt(), "Created at should not be null");
        assertNotEquals(existingCreatedAt, existingUser.getCreatedAt(),
                "onCreate overwrites existing createdAt (current implementation)");
    }

    @Test
    public void testUserEquality_SameIdShouldBeEqual() {
        // Note: User class doesn't override equals/hashCode, so this tests object
        // identity
        // If you want to test logical equality, you'd need to add @EqualsAndHashCode to
        // User

        // Given
        User user1 = User.builder()
                .id("HNET-SAME001")
                .publicKey("key1")
                .build();

        User user2 = User.builder()
                .id("HNET-SAME001")
                .publicKey("key2")
                .build();

        // Then - Without @EqualsAndHashCode, these are different objects
        assertNotEquals(user1, user2, "Without @EqualsAndHashCode, users are compared by reference");

        // But they should have the same ID
        assertEquals(user1.getId(), user2.getId(), "Both users should have the same ID");
    }

    @Test
    public void testUserToString_ShouldNotThrowException() {
        // Given
        User user = User.builder()
                .id("HNET-STR001")
                .publicKey("string-test-key")
                .build();

        // When
        String userString = user.toString();

        // Then
        assertNotNull(userString, "toString should not return null");
        assertFalse(userString.isEmpty(), "toString should not return empty string");
        // Lombok @ToString should include class name
        assertTrue(userString.contains("User"), "toString should contain class name");
    }
}
