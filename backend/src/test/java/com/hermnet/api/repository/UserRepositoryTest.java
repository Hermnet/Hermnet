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

        userRepository.deleteAll();
    }



    @Test
    public void testSaveUser_ShouldPersistUser() {

        User user = User.builder()
                .idHash("HNET-TEST001")
                .publicKey("ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ...")
                .build();


        User savedUser = userRepository.save(user);


        assertNotNull(savedUser, "Saved user should not be null");
        assertEquals("HNET-TEST001", savedUser.getIdHash());
        assertNotNull(savedUser.getCreatedAt(), "CreatedAt should be auto-generated");
        

        Optional<User> retrievedUser = userRepository.findById("HNET-TEST001");
        assertTrue(retrievedUser.isPresent(), "Should fail to find user by ID");
        assertEquals("HNET-TEST001", retrievedUser.get().getIdHash());
    }

    @Test
    public void testSaveUser_ShouldAutoGenerateCreatedAt() {

        User user = User.builder()
                .idHash("HNET-TIME001")
                .publicKey("timestamp-key")
                .build();


        User savedUser = userRepository.save(user);


        assertNotNull(savedUser.getCreatedAt(), "CreatedAt should not be null");
    }

    @Test
    public void testSaveMultipleUsers_ShouldPersistAll() {

        User user1 = User.builder().idHash("HNET-MULTI001").publicKey("key1").build();
        User user2 = User.builder().idHash("HNET-MULTI002").publicKey("key2").build();


        userRepository.save(user1);
        userRepository.save(user2);


        assertEquals(2, userRepository.count(), "Should have 2 users in database");
    }



    @Test
    public void testFindById_ShouldReturnUser_WhenExists() {

        User user = User.builder()
                .idHash("HNET-FIND001")
                .publicKey("find-by-id-key")
                .build();
        userRepository.save(user);


        Optional<User> found = userRepository.findById("HNET-FIND001");


        assertTrue(found.isPresent(), "Should find user");
        assertEquals("HNET-FIND001", found.get().getIdHash());
    }

    @Test
    public void testFindById_ShouldReturnEmpty_WhenNotExists() {

        Optional<User> found = userRepository.findById("NON-EXISTENT-ID");


        assertFalse(found.isPresent(), "Should return empty optional for non-existent ID");
    }

    @Test
    public void testFindByPublicKey_ShouldReturnUser_WhenExists() {

        User user = User.builder()
                .idHash("HNET-ByKEY")
                .publicKey("unique-public-key-123")
                .build();
        userRepository.save(user);


        Optional<User> found = userRepository.findByPublicKey("unique-public-key-123");


        assertTrue(found.isPresent(), "Should find user by public key");
        assertEquals("HNET-ByKEY", found.get().getIdHash());
    }

    @Test
    public void testFindByPublicKey_ShouldReturnEmpty_WhenNotExists() {

        Optional<User> found = userRepository.findByPublicKey("non-existent-key");


        assertFalse(found.isPresent(), "Should return empty optional for non-existent key");
    }

    @Test
    public void testFindAll_ShouldReturnAllUsers() {

        userRepository.save(User.builder().idHash("HNET-1").publicKey("key1").build());
        userRepository.save(User.builder().idHash("HNET-2").publicKey("key2").build());


        long count = userRepository.count();


        assertEquals(2, count, "Should have 2 users");
    }

    @Test
    public void testFindAll_ShouldReturnEmptyList_WhenNoUsers() {

        long count = userRepository.count();


        assertEquals(0, count, "Should have 0 users initially");
    }

    @Test
    public void testCount() {

        userRepository.save(User.builder().idHash("HNET-COUNT").publicKey("count-key").build());


        assertEquals(1, userRepository.count(), "Count should be 1");
    }

    @Test
    public void testExistsById() {

        userRepository.save(User.builder().idHash("HNET-EXIST").publicKey("exist-key").build());


        assertTrue(userRepository.existsById("HNET-EXIST"), "Should return true for existing ID");
        assertFalse(userRepository.existsById("NON-EXISTENT"), "Should return false for non-existent ID");
    }



    @Test
    public void testUpdateUser_ShouldModifyExistingUser() {

        User user = User.builder()
                .idHash("HNET-UPDATE001")
                .publicKey("original-key")
                .build();
        userRepository.save(user);
    

        User fetchedUser = userRepository.findById("HNET-UPDATE001").get();
        fetchedUser.setPublicKey("updated-key");
        userRepository.save(fetchedUser);
    

        assertEquals("updated-key", fetchedUser.getPublicKey(), "Public key should be updated");
        

        User foundUser = userRepository.findById("HNET-UPDATE001").get();
        assertEquals("updated-key", foundUser.getPublicKey(), "Updated key should persist in database");
    }

    @Test
    public void testSaveUser_DuplicateId_ShouldUpdateExisting() {

        User user1 = User.builder()
                .idHash("HNET-DUPID001")
                .publicKey("first-key")
                .build();
        userRepository.save(user1);





        
        User fetched = userRepository.findById("HNET-DUPID001").get();
        fetched.setPublicKey("second-key");
        userRepository.save(fetched);


        assertEquals(1, userRepository.count(), "Should still have only 1 user");
        User found = userRepository.findById("HNET-DUPID001").get();
        assertEquals("second-key", found.getPublicKey(), "Public key should be updated");
    }



    @Test
    public void testDeleteById_ShouldRemoveUser() {

        userRepository.save(User.builder().idHash("HNET-DEL").publicKey("del-key").build());


        userRepository.deleteById("HNET-DEL");


        assertFalse(userRepository.existsById("HNET-DEL"), "User should be deleted");
    }

    @Test
    public void testDelete_ShouldRemoveUser() {

        User user = User.builder().idHash("HNET-DELOBJ").publicKey("del-obj-key").build();
        userRepository.save(user);


        userRepository.delete(user);


        assertFalse(userRepository.existsById("HNET-DELOBJ"), "User should be deleted");
    }

    @Test
    public void testDeleteAll_ShouldRemoveAllUsers() {

        userRepository.save(User.builder().idHash("HNET-1").publicKey("k1").build());
        userRepository.save(User.builder().idHash("HNET-2").publicKey("k2").build());


        userRepository.deleteAll();


        assertEquals(0, userRepository.count(), "Database should be empty");
    }



    @Test
    public void testSaveUser_DuplicatePublicKey_ShouldThrowException() {

        User user1 = User.builder()
                .idHash("HNET-DUP001")
                .publicKey("duplicate-key")
                .build();
        userRepository.save(user1);


        User user2 = User.builder()
                .idHash("HNET-DUP002")
                .publicKey("duplicate-key")
                .build();


        assertThrows(DataIntegrityViolationException.class, () -> {
            userRepository.save(user2);
            userRepository.flush();
        }, "Should throw exception when saving duplicate public key");
    }



    @Test
    public void testSaveUser_WithNullId_ShouldThrowException() {

        User user = User.builder()
                .idHash(null)
                .publicKey("valid-key")
                .build();


        assertThrows(Exception.class, () -> userRepository.save(user));
    }

    @Test
    public void testSaveUser_WithVeryLongPublicKey_ShouldPercentage() {

        String longKey = "ssh-rsa " + "A".repeat(5000);
        User user = User.builder()
                .idHash("HNET-LONG")
                .publicKey(longKey)
                .build();


        userRepository.save(user);


        User found = userRepository.findById("HNET-LONG").get();
        assertEquals(longKey, found.getPublicKey(), "Should verify long public key storage");
    }
}
