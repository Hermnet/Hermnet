package com.hermnet.api.service;

import com.hermnet.api.model.User;
import com.hermnet.api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for UserService.
 * 
 * These tests verify the business logic of user registration including:
 * - ID format validation
 * - Duplicate ID detection
 * - Duplicate public key detection
 * - Successful user registration
 * - Edge cases and error handling
 * 
 * Uses Mockito to mock the UserRepository dependency, allowing us to test
 * the service layer in isolation without requiring a database.
 */
@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private String validId;
    private String validPublicKey;

    @BeforeEach
    public void setUp() {
        // Set up valid test data
        validId = "HNET-TEST001";
        validPublicKey = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ...";
    }

    // ==================== SUCCESSFUL REGISTRATION TESTS ====================

    @Test
    public void testRegisterUser_WithValidData_ShouldSucceed() {
        // Given
        when(userRepository.existsById(validId)).thenReturn(false);
        when(userRepository.findByPublicKey(validPublicKey)).thenReturn(Optional.empty());

        User savedUser = User.builder()
                .id(validId)
                .publicKey(validPublicKey)
                .build();
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        // When
        User result = userService.registerUser(validId, validPublicKey);

        // Then
        assertNotNull(result, "Registered user should not be null");
        assertEquals(validId, result.getId(), "User ID should match");
        assertEquals(validPublicKey, result.getPublicKey(), "Public key should match");

        // Verify interactions
        verify(userRepository, times(1)).existsById(validId);
        verify(userRepository, times(1)).findByPublicKey(validPublicKey);
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    public void testRegisterUser_ShouldCallRepositoryInCorrectOrder() {
        // Given
        when(userRepository.existsById(anyString())).thenReturn(false);
        when(userRepository.findByPublicKey(anyString())).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(new User());

        // When
        userService.registerUser(validId, validPublicKey);

        // Then - Verify the order of operations
        var inOrder = inOrder(userRepository);
        inOrder.verify(userRepository).existsById(validId);
        inOrder.verify(userRepository).findByPublicKey(validPublicKey);
        inOrder.verify(userRepository).save(any(User.class));
    }

    @Test
    public void testRegisterUser_WithMinimalValidId_ShouldSucceed() {
        // Given - Minimal valid ID (just "HNET-")
        String minimalId = "HNET-1";
        when(userRepository.existsById(minimalId)).thenReturn(false);
        when(userRepository.findByPublicKey(validPublicKey)).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(new User());

        // When
        User result = userService.registerUser(minimalId, validPublicKey);

        // Then
        assertNotNull(result, "Should register user with minimal valid ID");
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    public void testRegisterUser_WithLongValidId_ShouldSucceed() {
        // Given - Long but valid ID
        String longId = "HNET-" + "X".repeat(50);
        when(userRepository.existsById(longId)).thenReturn(false);
        when(userRepository.findByPublicKey(validPublicKey)).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(new User());

        // When
        User result = userService.registerUser(longId, validPublicKey);

        // Then
        assertNotNull(result, "Should register user with long valid ID");
        verify(userRepository, times(1)).save(any(User.class));
    }

    // ==================== INVALID ID FORMAT TESTS ====================

    @Test
    public void testRegisterUser_WithInvalidIdFormat_ShouldThrowException() {
        // Given - ID doesn't start with "HNET-"
        String invalidId = "USER-123";

        // When/Then
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> userService.registerUser(invalidId, validPublicKey),
                "Should throw IllegalArgumentException for invalid ID format");

        assertEquals("Invalid user ID format", exception.getMessage());

        // Verify repository was never called
        verify(userRepository, never()).existsById(anyString());
        verify(userRepository, never()).findByPublicKey(anyString());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    public void testRegisterUser_WithEmptyId_ShouldThrowException() {
        // Given
        String emptyId = "";

        // When/Then
        assertThrows(
                IllegalArgumentException.class,
                () -> userService.registerUser(emptyId, validPublicKey),
                "Should throw exception for empty ID");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    public void testRegisterUser_WithNullId_ShouldThrowException() {
        // Given
        String nullId = null;

        // When/Then
        assertThrows(
                NullPointerException.class,
                () -> userService.registerUser(nullId, validPublicKey),
                "Should throw exception for null ID");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    public void testRegisterUser_WithLowercaseHnet_ShouldThrowException() {
        // Given - Lowercase "hnet-" instead of "HNET-"
        String lowercaseId = "hnet-123";

        // When/Then
        assertThrows(
                IllegalArgumentException.class,
                () -> userService.registerUser(lowercaseId, validPublicKey),
                "Should throw exception for lowercase HNET prefix");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    public void testRegisterUser_WithPartialPrefix_ShouldThrowException() {
        // Given - Only "HNE-" instead of "HNET-"
        String partialPrefix = "HNE-123";

        // When/Then
        assertThrows(
                IllegalArgumentException.class,
                () -> userService.registerUser(partialPrefix, validPublicKey),
                "Should throw exception for partial prefix");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    public void testRegisterUser_WithPrefixInMiddle_ShouldThrowException() {
        // Given - "HNET-" not at the start
        String prefixInMiddle = "USER-HNET-123";

        // When/Then
        assertThrows(
                IllegalArgumentException.class,
                () -> userService.registerUser(prefixInMiddle, validPublicKey),
                "Should throw exception when HNET- is not at the start");

        verify(userRepository, never()).save(any(User.class));
    }

    // ==================== DUPLICATE ID TESTS ====================

    @Test
    public void testRegisterUser_WithDuplicateId_ShouldThrowException() {
        // Given - User ID already exists
        when(userRepository.existsById(validId)).thenReturn(true);

        // When/Then
        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> userService.registerUser(validId, validPublicKey),
                "Should throw IllegalStateException for duplicate ID");

        assertEquals("User already exists", exception.getMessage());

        // Verify we checked for existence but never tried to save
        verify(userRepository, times(1)).existsById(validId);
        verify(userRepository, never()).findByPublicKey(anyString());
        verify(userRepository, never()).save(any(User.class));
    }

    // ==================== DUPLICATE PUBLIC KEY TESTS ====================

    @Test
    public void testRegisterUser_WithDuplicatePublicKey_ShouldThrowException() {
        // Given - Public key already in use
        when(userRepository.existsById(validId)).thenReturn(false);

        User existingUser = User.builder()
                .id("HNET-OTHER001")
                .publicKey(validPublicKey)
                .build();
        when(userRepository.findByPublicKey(validPublicKey)).thenReturn(Optional.of(existingUser));

        // When/Then
        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> userService.registerUser(validId, validPublicKey),
                "Should throw IllegalStateException for duplicate public key");

        assertEquals("This public key is already in use", exception.getMessage());

        // Verify we checked both ID and public key but never saved
        verify(userRepository, times(1)).existsById(validId);
        verify(userRepository, times(1)).findByPublicKey(validPublicKey);
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    public void testRegisterUser_WithNullPublicKey_ShouldAttemptToRegister() {
        // Given - Null public key (should be handled by database constraint)
        String nullPublicKey = null;
        when(userRepository.existsById(validId)).thenReturn(false);
        when(userRepository.findByPublicKey(nullPublicKey)).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(new User());

        // When
        User result = userService.registerUser(validId, nullPublicKey);

        // Then - Service allows it, database will enforce NOT NULL constraint
        assertNotNull(result, "Service should attempt to save user with null public key");
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    public void testRegisterUser_WithEmptyPublicKey_ShouldAttemptToRegister() {
        // Given - Empty public key
        String emptyPublicKey = "";
        when(userRepository.existsById(validId)).thenReturn(false);
        when(userRepository.findByPublicKey(emptyPublicKey)).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(new User());

        // When
        User result = userService.registerUser(validId, emptyPublicKey);

        // Then - Service allows it (business logic may want to add validation later)
        assertNotNull(result, "Service should attempt to save user with empty public key");
        verify(userRepository, times(1)).save(any(User.class));
    }

    // ==================== EDGE CASE TESTS ====================

    @Test
    public void testRegisterUser_WithSpecialCharactersInPublicKey_ShouldSucceed() {
        // Given - Public key with special characters
        String specialKey = "ssh-rsa AAAA+/=@#$%^&*()";
        when(userRepository.existsById(validId)).thenReturn(false);
        when(userRepository.findByPublicKey(specialKey)).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(new User());

        // When
        User result = userService.registerUser(validId, specialKey);

        // Then
        assertNotNull(result, "Should handle special characters in public key");
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    public void testRegisterUser_WithVeryLongPublicKey_ShouldSucceed() {
        // Given - Very long public key
        String longKey = "ssh-rsa " + "A".repeat(5000);
        when(userRepository.existsById(validId)).thenReturn(false);
        when(userRepository.findByPublicKey(longKey)).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(new User());

        // When
        User result = userService.registerUser(validId, longKey);

        // Then
        assertNotNull(result, "Should handle very long public keys");
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    public void testRegisterUser_WithWhitespaceInId_ShouldSucceed() {
        // Given - ID with whitespace (starts with HNET- so it's valid)
        String idWithSpace = "HNET- 123";
        when(userRepository.existsById(idWithSpace)).thenReturn(false);
        when(userRepository.findByPublicKey(validPublicKey)).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(new User());

        // When
        User result = userService.registerUser(idWithSpace, validPublicKey);

        // Then
        assertNotNull(result, "Should accept ID with whitespace if it starts with HNET-");
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    public void testRegisterUser_VerifyUserBuilderUsage() {
        // Given
        when(userRepository.existsById(validId)).thenReturn(false);
        when(userRepository.findByPublicKey(validPublicKey)).thenReturn(Optional.empty());

        // Capture the user being saved
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            assertEquals(validId, user.getId(), "Saved user should have correct ID");
            assertEquals(validPublicKey, user.getPublicKey(), "Saved user should have correct public key");
            return user;
        });

        // When
        userService.registerUser(validId, validPublicKey);

        // Then - Verified in the answer above
        verify(userRepository, times(1)).save(any(User.class));
    }

    // ==================== VALIDATION ORDER TESTS ====================

    @Test
    public void testRegisterUser_ShouldValidateIdFormatBeforeCheckingDuplicates() {
        // Given - Invalid ID format
        String invalidId = "INVALID-123";

        // When/Then
        assertThrows(
                IllegalArgumentException.class,
                () -> userService.registerUser(invalidId, validPublicKey));

        // Verify that we never checked the repository (format validation happens first)
        verify(userRepository, never()).existsById(anyString());
        verify(userRepository, never()).findByPublicKey(anyString());
    }

    @Test
    public void testRegisterUser_ShouldCheckIdExistenceBeforePublicKey() {
        // Given - Duplicate ID
        when(userRepository.existsById(validId)).thenReturn(true);

        // When/Then
        assertThrows(
                IllegalStateException.class,
                () -> userService.registerUser(validId, validPublicKey));

        // Verify we checked ID but never checked public key
        verify(userRepository, times(1)).existsById(validId);
        verify(userRepository, never()).findByPublicKey(anyString());
    }
}
