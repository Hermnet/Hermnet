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

        user = new User();
    }

    @Test
    public void testUserBuilder_ShouldCreateUserWithAllFields() {

        String expectedIdHash = "AB123456HASH";
        String expectedPublicKey = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ...";
        String expectedPushToken = "push-token-123";
        LocalDateTime expectedCreatedAt = LocalDateTime.now();


        User builtUser = User.builder()
                .idHash(expectedIdHash)
                .publicKey(expectedPublicKey)
                .pushToken(expectedPushToken)
                .createdAt(expectedCreatedAt)
                .build();


        assertNotNull(builtUser, "Built user should not be null");
        assertEquals(expectedIdHash, builtUser.getIdHash(), "User ID Hash should match");
        assertEquals(expectedPublicKey, builtUser.getPublicKey(), "Public key should match");
        assertEquals(expectedPushToken, builtUser.getPushToken(), "Push token should match");
        assertEquals(expectedCreatedAt, builtUser.getCreatedAt(), "Created at should match");
    }

    @Test
    public void testUserBuilder_WithMinimalFields() {

        String expectedIdHash = "MIN-HASH-001";
        String expectedPublicKey = "minimal-key";


        User builtUser = User.builder()
                .idHash(expectedIdHash)
                .publicKey(expectedPublicKey)
                .build();


        assertNotNull(builtUser, "Built user should not be null");
        assertEquals(expectedIdHash, builtUser.getIdHash(), "User ID Hash should match");
        assertEquals(expectedPublicKey, builtUser.getPublicKey(), "Public key should match");
        assertNull(builtUser.getPushToken(), "Push token should be null when not set");
        assertNull(builtUser.getCreatedAt(), "Created at should be null when not set in builder");
    }

    @Test
    public void testNoArgsConstructor_ShouldCreateEmptyUser() {

        User emptyUser = new User();


        assertNotNull(emptyUser, "User created with no-args constructor should not be null");
        assertNull(emptyUser.getIdHash(), "ID hash should be null");
        assertNull(emptyUser.getPublicKey(), "Public key should be null");
        assertNull(emptyUser.getCreatedAt(), "Created at should be null");
    }

    @Test
    public void testAllArgsConstructor_ShouldCreateUserWithAllFields() {

        String expectedIdHash = "ALL-AGS-HASH";
        String expectedPublicKey = "all-args-key";
        String expectedPushToken = "push-token";
        LocalDateTime expectedCreatedAt = LocalDateTime.now();


        User allArgsUser = new User(expectedIdHash, expectedPublicKey, expectedPushToken, expectedCreatedAt);


        assertNotNull(allArgsUser, "User created with all-args constructor should not be null");
        assertEquals(expectedIdHash, allArgsUser.getIdHash());
        assertEquals(expectedPublicKey, allArgsUser.getPublicKey());
        assertEquals(expectedPushToken, allArgsUser.getPushToken());
        assertEquals(expectedCreatedAt, allArgsUser.getCreatedAt());
    }

    @Test
    public void testSettersAndGetters_ShouldWorkCorrectly() {

        String expectedIdHash = "SETTER-HASH";
        String expectedPublicKey = "setter-test-key";
        String expectedPushToken = "setter-token";
        LocalDateTime expectedCreatedAt = LocalDateTime.now();


        user.setIdHash(expectedIdHash);
        user.setPublicKey(expectedPublicKey);
        user.setPushToken(expectedPushToken);
        user.setCreatedAt(expectedCreatedAt);


        assertEquals(expectedIdHash, user.getIdHash());
        assertEquals(expectedPublicKey, user.getPublicKey());
        assertEquals(expectedPushToken, user.getPushToken());
        assertEquals(expectedCreatedAt, user.getCreatedAt());
    }

    @Test
    public void testSetIdHash_WithNullValue() {

        user.setIdHash(null);


        assertNull(user.getIdHash(), "ID Hash should be null when set to null");
    }

    @Test
    public void testSetIdHash_WithMaxLength() {

        String maxLengthId = "H".repeat(64);


        user.setIdHash(maxLengthId);


        assertEquals(maxLengthId, user.getIdHash());
        assertEquals(64, user.getIdHash().length());
    }

    @Test
    public void testPrePersist_ShouldSetCreatedAtAutomatically() {

        User newUser = User.builder()
                .idHash("PERSIST-HASH")
                .publicKey("persist-test-key")
                .build();


        assertNull(newUser.getCreatedAt(), "Created at should be null before persistence");


        newUser.onCreate();


        assertNotNull(newUser.getCreatedAt(), "Created at should be set after @PrePersist");
    }
}
