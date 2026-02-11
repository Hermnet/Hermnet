package com.hermnet.api.repository;

import com.hermnet.api.model.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for UserRepository.
 * 
 * These tests verify:
 * - CRUD operations (Create, Read, Update, Delete)
 * - Custom query methods (findByPublicKey)
 * - Database constraints (unique public key, nullable fields)
 * - JPA lifecycle callbacks (@PrePersist)
 * - Edge cases and error handling
 * 
 * Uses @DataJpaTest which provides:
 * - Transactional test execution (rollback after each test)
 * - In-memory or configured test database
 * - Auto-configuration of JPA components
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
public class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    public void setUp() {
        // Clean up database before each test to ensure isolation
        userRepository.deleteAll();
    }

    // Note: No tearDown needed - @DataJpaTest automatically rolls back transactions
    // after each test

    // ==================== CREATE TESTS ====================

    @Test
    public void testSaveUser_ShouldPersistSuccessfully() {
        // Given
        User user = User.builder()
                .id("HNET-SAVE001")
                .publicKey("ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ...")
                .build();

        // When
        User savedUser = userRepository.save(user);

        // Then
        assertNotNull(savedUser, "Saved user should not be null");
        assertEquals("HNET-SAVE001", savedUser.getId(), "User ID should match");
        assertNotNull(savedUser.getCreatedAt(), "CreatedAt should be set by @PrePersist");
    }

    @Test
    public void testSaveUser_ShouldAutoGenerateCreatedAt() {
        // Given
        User user = User.builder()
                .id("HNET-TIMESTAMP001")
                .publicKey("timestamp-test-key")
                .build();

        // Verify createdAt is null before save
        assertNull(user.getCreatedAt(), "CreatedAt should be null before persistence");

        // When
        User savedUser = userRepository.save(user);

        // Then
        assertNotNull(savedUser.getCreatedAt(), "CreatedAt should be automatically set on save");
    }

    @Test
    public void testSaveMultipleUsers_ShouldPersistAll() {
        // Given
        User user1 = User.builder().id("HNET-MULTI001").publicKey("key1").build();
        User user2 = User.builder().id("HNET-MULTI002").publicKey("key2").build();
        User user3 = User.builder().id("HNET-MULTI003").publicKey("key3").build();

        // When
        userRepository.save(user1);
        userRepository.save(user2);
        userRepository.save(user3);

        // Then
        List<User> allUsers = userRepository.findAll();
        assertEquals(3, allUsers.size(), "Should have 3 users in database");
    }

    // ==================== READ TESTS ====================

    @Test
    public void testFindById_ExistingUser_ShouldReturnUser() {
        // Given
        User user = User.builder()
                .id("HNET-FIND001")
                .publicKey("find-test-key")
                .build();
        userRepository.save(user);

        // When
        Optional<User> found = userRepository.findById("HNET-FIND001");

        // Then
        assertTrue(found.isPresent(), "User should be found");
        assertEquals("HNET-FIND001", found.get().getId(), "User ID should match");
        assertEquals("find-test-key", found.get().getPublicKey(), "Public key should match");
    }

    @Test
    public void testFindById_NonExistingUser_ShouldReturnEmpty() {
        // When
        Optional<User> found = userRepository.findById("HNET-NONEXISTENT");

        // Then
        assertFalse(found.isPresent(), "Should return empty Optional for non-existent user");
    }

    @Test
    public void testFindByPublicKey_ExistingKey_ShouldReturnUser() {
        // Given
        String publicKey = "ssh-rsa UNIQUE_KEY_12345";
        User user = User.builder()
                .id("HNET-PUBKEY001")
                .publicKey(publicKey)
                .build();
        userRepository.save(user);

        // When
        Optional<User> found = userRepository.findByPublicKey(publicKey);

        // Then
        assertTrue(found.isPresent(), "User should be found by public key");
        assertEquals("HNET-PUBKEY001", found.get().getId(), "User ID should match");
        assertEquals(publicKey, found.get().getPublicKey(), "Public key should match");
    }

    @Test
    public void testFindByPublicKey_NonExistingKey_ShouldReturnEmpty() {
        // When
        Optional<User> found = userRepository.findByPublicKey("non-existent-key");

        // Then
        assertFalse(found.isPresent(), "Should return empty Optional for non-existent public key");
    }

    @Test
    public void testFindAll_ShouldReturnAllUsers() {
        // Given
        userRepository.save(User.builder().id("HNET-ALL001").publicKey("key1").build());
        userRepository.save(User.builder().id("HNET-ALL002").publicKey("key2").build());
        userRepository.save(User.builder().id("HNET-ALL003").publicKey("key3").build());

        // When
        List<User> allUsers = userRepository.findAll();

        // Then
        assertEquals(3, allUsers.size(), "Should return all 3 users");
    }

    @Test
    public void testFindAll_EmptyDatabase_ShouldReturnEmptyList() {
        // When
        List<User> allUsers = userRepository.findAll();

        // Then
        assertTrue(allUsers.isEmpty(), "Should return empty list when no users exist");
    }

    @Test
    public void testCount_ShouldReturnCorrectCount() {
        // Given
        userRepository.save(User.builder().id("HNET-COUNT001").publicKey("key1").build());
        userRepository.save(User.builder().id("HNET-COUNT002").publicKey("key2").build());

        // When
        long count = userRepository.count();

        // Then
        assertEquals(2, count, "Should return correct count of users");
    }

    @Test
    public void testExistsById_ExistingUser_ShouldReturnTrue() {
        // Given
        userRepository.save(User.builder().id("HNET-EXISTS001").publicKey("exists-key").build());

        // When
        boolean exists = userRepository.existsById("HNET-EXISTS001");

        // Then
        assertTrue(exists, "Should return true for existing user");
    }

    @Test
    public void testExistsById_NonExistingUser_ShouldReturnFalse() {
        // When
        boolean exists = userRepository.existsById("HNET-NONEXISTENT");

        // Then
        assertFalse(exists, "Should return false for non-existent user");
    }

    // ==================== UPDATE TESTS ====================

    @Test
    public void testUpdateUser_ShouldModifyExistingUser() {
        // Given - Create and save initial user
        User user = User.builder()
                .id("HNET-UPDATE001")
                .publicKey("original-key")
                .build();
        userRepository.save(user);

        // When - Fetch the user from database and update the public key
        User fetchedUser = userRepository.findById("HNET-UPDATE001").get();
        fetchedUser.setPublicKey("updated-key");
        User updatedUser = userRepository.save(fetchedUser);

        // Then
        assertEquals("updated-key", updatedUser.getPublicKey(), "Public key should be updated");

        // Verify in database
        User foundUser = userRepository.findById("HNET-UPDATE001").get();
        assertEquals("updated-key", foundUser.getPublicKey(), "Updated key should persist in database");
    }

    // ==================== DELETE TESTS ====================

    @Test
    public void testDeleteById_ShouldRemoveUser() {
        // Given
        User user = User.builder()
                .id("HNET-DELETE001")
                .publicKey("delete-test-key")
                .build();
        userRepository.save(user);

        // Verify user exists
        assertTrue(userRepository.existsById("HNET-DELETE001"), "User should exist before deletion");

        // When
        userRepository.deleteById("HNET-DELETE001");

        // Then
        assertFalse(userRepository.existsById("HNET-DELETE001"), "User should not exist after deletion");
    }

    @Test
    public void testDelete_ShouldRemoveUser() {
        // Given
        User user = User.builder()
                .id("HNET-DELETE002")
                .publicKey("delete-entity-key")
                .build();
        User savedUser = userRepository.save(user);

        // When
        userRepository.delete(savedUser);

        // Then
        assertFalse(userRepository.existsById("HNET-DELETE002"), "User should be deleted");
    }

    @Test
    public void testDeleteAll_ShouldRemoveAllUsers() {
        // Given
        userRepository.save(User.builder().id("HNET-DELALL001").publicKey("key1").build());
        userRepository.save(User.builder().id("HNET-DELALL002").publicKey("key2").build());
        userRepository.save(User.builder().id("HNET-DELALL003").publicKey("key3").build());

        // Verify users exist
        assertEquals(3, userRepository.count(), "Should have 3 users before deletion");

        // When
        userRepository.deleteAll();

        // Then
        assertEquals(0, userRepository.count(), "Should have 0 users after deleteAll");
    }

    // ==================== CONSTRAINT TESTS ====================

    @Test
    public void testSaveUser_DuplicatePublicKey_ShouldThrowException() {
        // Given - Save first user with a public key
        User user1 = User.builder()
                .id("HNET-DUP001")
                .publicKey("duplicate-key")
                .build();
        userRepository.save(user1);

        // When/Then - Try to save second user with same public key
        User user2 = User.builder()
                .id("HNET-DUP002")
                .publicKey("duplicate-key")
                .build();

        // Should throw exception due to unique constraint on publicKey
        assertThrows(DataIntegrityViolationException.class, () -> {
            userRepository.save(user2);
            userRepository.flush(); // Force immediate database interaction
        }, "Should throw exception when saving duplicate public key");
    }

    @Test
    public void testSaveUser_DuplicateId_ShouldUpdateExisting() {
        // Given - Save first user
        User user1 = User.builder()
                .id("HNET-DUPID001")
                .publicKey("first-key")
                .build();
        userRepository.save(user1);

        // When - Fetch and update the user with a different public key
        User fetchedUser = userRepository.findById("HNET-DUPID001").get();
        fetchedUser.setPublicKey("second-key");
        userRepository.save(fetchedUser);

        // Then - Should update existing user (ID is primary key)
        assertEquals(1, userRepository.count(), "Should still have only 1 user");
        User found = userRepository.findById("HNET-DUPID001").get();
        assertEquals("second-key", found.getPublicKey(), "Public key should be updated");
    }

    // ==================== EDGE CASE TESTS ====================

    @Test
    public void testSaveUser_WithVeryLongPublicKey_ShouldSucceed() {
        // Given - Create a very long public key (TEXT column should handle it)
        String longKey = "ssh-rsa " + "A".repeat(5000);
        User user = User.builder()
                .id("HNET-LONG001")
                .publicKey(longKey)
                .build();

        // When
        User savedUser = userRepository.save(user);

        // Then
        assertEquals(longKey, savedUser.getPublicKey(), "Long public key should be saved");

        // Verify retrieval
        User found = userRepository.findById("HNET-LONG001").get();
        assertEquals(longKey, found.getPublicKey(), "Long public key should be retrieved correctly");
    }

    @Test
    public void testSaveUser_WithMaxLengthId_ShouldSucceed() {
        // Given - ID column has length 64
        String maxLengthId = "HNET-" + "X".repeat(59); // Total 64 characters
        User user = User.builder()
                .id(maxLengthId)
                .publicKey("max-id-key")
                .build();

        // When
        User savedUser = userRepository.save(user);

        // Then
        assertEquals(maxLengthId, savedUser.getId(), "Max length ID should be saved");
        assertEquals(64, savedUser.getId().length(), "ID should be 64 characters");
    }

    @Test
    public void testFindByPublicKey_WithSpecialCharacters_ShouldWork() {
        // Given
        String specialKey = "ssh-rsa AAAA+/=@#$%^&*()";
        User user = User.builder()
                .id("HNET-SPECIAL001")
                .publicKey(specialKey)
                .build();
        userRepository.save(user);

        // When
        Optional<User> found = userRepository.findByPublicKey(specialKey);

        // Then
        assertTrue(found.isPresent(), "Should find user with special characters in public key");
        assertEquals(specialKey, found.get().getPublicKey(), "Special characters should be preserved");
    }
}
