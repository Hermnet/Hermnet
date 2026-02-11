package com.hermnet.api.repository;

import com.hermnet.api.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for UserRepository.
 * 
 * Verifies database operations for User entity including:
 * - CRUD operations (Create, Read, Update, Delete)
 * - Custom query methods
 * - Database constraints and validation
 * - Lifecycle callbacks (@PrePersist)
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

    // ==================== CREATE TESTS ====================

    @Test
    public void testSaveUser_ShouldPersistUser() {
        // Given
        User user = User.builder()
                .idHash("HNET-TEST001")
                .publicKey("ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ...")
                .build();

        // When
        User savedUser = userRepository.save(user);

        // Then
        assertNotNull(savedUser, "Saved user should not be null");
        assertEquals("HNET-TEST001", savedUser.getIdHash());
        assertNotNull(savedUser.getCreatedAt(), "CreatedAt should be auto-generated");
        
        // Verify we can retrieve it
        Optional<User> retrievedUser = userRepository.findById("HNET-TEST001");
        assertTrue(retrievedUser.isPresent(), "Should fail to find user by ID");
        assertEquals("HNET-TEST001", retrievedUser.get().getIdHash());
    }

    @Test
    public void testSaveUser_ShouldAutoGenerateCreatedAt() {
        // Given
        User user = User.builder()
                .idHash("HNET-TIME001")
                .publicKey("timestamp-key")
                .build();

        // When
        User savedUser = userRepository.save(user);

        // Then
        assertNotNull(savedUser.getCreatedAt(), "CreatedAt should not be null");
    }

    @Test
    public void testSaveMultipleUsers_ShouldPersistAll() {
        // Given
        User user1 = User.builder().idHash("HNET-MULTI001").publicKey("key1").build();
        User user2 = User.builder().idHash("HNET-MULTI002").publicKey("key2").build();

        // When
        userRepository.save(user1);
        userRepository.save(user2);

        // Then
        assertEquals(2, userRepository.count(), "Should have 2 users in database");
    }

    // ==================== READ TESTS ====================

    @Test
    public void testFindById_ShouldReturnUser_WhenExists() {
        // Given
        User user = User.builder()
                .idHash("HNET-FIND001")
                .publicKey("find-by-id-key")
                .build();
        userRepository.save(user);

        // When
        Optional<User> found = userRepository.findById("HNET-FIND001");

        // Then
        assertTrue(found.isPresent(), "Should find user");
        assertEquals("HNET-FIND001", found.get().getIdHash());
    }

    @Test
    public void testFindById_ShouldReturnEmpty_WhenNotExists() {
        // When
        Optional<User> found = userRepository.findById("NON-EXISTENT-ID");

        // Then
        assertFalse(found.isPresent(), "Should return empty optional for non-existent ID");
    }

    @Test
    public void testFindByPublicKey_ShouldReturnUser_WhenExists() {
        // Given
        User user = User.builder()
                .idHash("HNET-ByKEY")
                .publicKey("unique-public-key-123")
                .build();
        userRepository.save(user);

        // When
        Optional<User> found = userRepository.findByPublicKey("unique-public-key-123");

        // Then
        assertTrue(found.isPresent(), "Should find user by public key");
        assertEquals("HNET-ByKEY", found.get().getIdHash());
    }

    @Test
    public void testFindByPublicKey_ShouldReturnEmpty_WhenNotExists() {
        // When
        Optional<User> found = userRepository.findByPublicKey("non-existent-key");

        // Then
        assertFalse(found.isPresent(), "Should return empty optional for non-existent key");
    }

    @Test
    public void testFindAll_ShouldReturnAllUsers() {
        // Given
        userRepository.save(User.builder().idHash("HNET-1").publicKey("key1").build());
        userRepository.save(User.builder().idHash("HNET-2").publicKey("key2").build());

        // When
        long count = userRepository.count();

        // Then
        assertEquals(2, count, "Should have 2 users");
    }

    @Test
    public void testFindAll_ShouldReturnEmptyList_WhenNoUsers() {
        // When
        long count = userRepository.count();

        // Then
        assertEquals(0, count, "Should have 0 users initially");
    }

    @Test
    public void testCount() {
        // Given
        userRepository.save(User.builder().idHash("HNET-COUNT").publicKey("count-key").build());

        // Then
        assertEquals(1, userRepository.count(), "Count should be 1");
    }

    @Test
    public void testExistsById() {
        // Given
        userRepository.save(User.builder().idHash("HNET-EXIST").publicKey("exist-key").build());

        // Then
        assertTrue(userRepository.existsById("HNET-EXIST"), "Should return true for existing ID");
        assertFalse(userRepository.existsById("NON-EXISTENT"), "Should return false for non-existent ID");
    }

    // ==================== UPDATE TESTS ====================

    @Test
    public void testUpdateUser_ShouldModifyExistingUser() {
        // Given - Create and save initial user
        User user = User.builder()
                .idHash("HNET-UPDATE001")
                .publicKey("original-key")
                .build();
        userRepository.save(user);
    
        // When - Fetch the user from database and update the public key
        User fetchedUser = userRepository.findById("HNET-UPDATE001").get();
        fetchedUser.setPublicKey("updated-key");
        userRepository.save(fetchedUser);
    
        // Then
        assertEquals("updated-key", fetchedUser.getPublicKey(), "Public key should be updated");
        
        // Verify in database
        User foundUser = userRepository.findById("HNET-UPDATE001").get();
        assertEquals("updated-key", foundUser.getPublicKey(), "Updated key should persist in database");
    }

    @Test
    public void testSaveUser_DuplicateId_ShouldUpdateExisting() {
        // Given - Save first user
        User user1 = User.builder()
                .idHash("HNET-DUPID001")
                .publicKey("first-key")
                .build();
        userRepository.save(user1);

        // When - Fetch (or create representative) and update
        // Note: Building a new object with same ID works for update ONLY if we handle unmodifiable fields 
        // like createdAt correctly, or if we are okay with them being overwritten/nulled if not set.
        // The safest way to "update" is fetch-modify-save.
        
        User fetched = userRepository.findById("HNET-DUPID001").get();
        fetched.setPublicKey("second-key");
        userRepository.save(fetched);

        // Then - Should update existing user (ID is primary key)
        assertEquals(1, userRepository.count(), "Should still have only 1 user");
        User found = userRepository.findById("HNET-DUPID001").get();
        assertEquals("second-key", found.getPublicKey(), "Public key should be updated");
    }

    // ==================== DELETE TESTS ====================

    @Test
    public void testDeleteById_ShouldRemoveUser() {
        // Given
        userRepository.save(User.builder().idHash("HNET-DEL").publicKey("del-key").build());

        // When
        userRepository.deleteById("HNET-DEL");

        // Then
        assertFalse(userRepository.existsById("HNET-DEL"), "User should be deleted");
    }

    @Test
    public void testDelete_ShouldRemoveUser() {
        // Given
        User user = User.builder().idHash("HNET-DELOBJ").publicKey("del-obj-key").build();
        userRepository.save(user);

        // When
        userRepository.delete(user);

        // Then
        assertFalse(userRepository.existsById("HNET-DELOBJ"), "User should be deleted");
    }

    @Test
    public void testDeleteAll_ShouldRemoveAllUsers() {
        // Given
        userRepository.save(User.builder().idHash("HNET-1").publicKey("k1").build());
        userRepository.save(User.builder().idHash("HNET-2").publicKey("k2").build());

        // When
        userRepository.deleteAll();

        // Then
        assertEquals(0, userRepository.count(), "Database should be empty");
    }

    // ==================== CONSTRAINTS & NEGATIVE TESTS ====================

    @Test
    public void testSaveUser_DuplicatePublicKey_ShouldThrowException() {
        // Given - Save first user with a public key
        User user1 = User.builder()
                .idHash("HNET-DUP001")
                .publicKey("duplicate-key")
                .build();
        userRepository.save(user1);

        // When/Then - Try to save second user with same public key
        User user2 = User.builder()
                .idHash("HNET-DUP002")
                .publicKey("duplicate-key")
                .build();

        // Should throw exception due to unique constraint on publicKey
        assertThrows(DataIntegrityViolationException.class, () -> {
            userRepository.save(user2);
            userRepository.flush(); // Force immediate database interaction
        }, "Should throw exception when saving duplicate public key");
    }

    // ==================== EDGE CASES ====================

    @Test
    public void testSaveUser_WithNullId_ShouldThrowException() {
        // Given
        User user = User.builder()
                .idHash(null)
                .publicKey("valid-key")
                .build();

        // When/Then
        assertThrows(Exception.class, () -> userRepository.save(user));
    }

    @Test
    public void testSaveUser_WithVeryLongPublicKey_ShouldPercentage() {
        // Given - Very long key
        String longKey = "ssh-rsa " + "A".repeat(5000);
        User user = User.builder()
                .idHash("HNET-LONG")
                .publicKey(longKey)
                .build();

        // When
        userRepository.save(user);

        // Then
        User found = userRepository.findById("HNET-LONG").get();
        assertEquals(longKey, found.getPublicKey(), "Should verify long public key storage");
    }
}
