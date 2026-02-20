package com.hermnet.api.service;

import com.hermnet.api.dto.RegisterRequest;
import com.hermnet.api.dto.UserResponse;
import com.hermnet.api.model.User;
import com.hermnet.api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for UserService.
 * 
 * Verifies business logic for user registration using the new DTO-based
 * approach.
 */
@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private RegisterRequest validRequest;

    @BeforeEach
    public void setUp() {
        validRequest = new RegisterRequest(
                "HNET-TEST001",
                "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ...",
                "push-token-123");
    }

    @Test
    public void testRegister_WithValidData_ShouldSucceed() {

        when(userRepository.existsById(validRequest.id())).thenReturn(false);

        User expectedUser = User.builder()
                .idHash(validRequest.id())
                .publicKey(validRequest.publicKey())
                .pushToken(validRequest.pushToken())
                .createdAt(java.time.LocalDateTime.now())
                .build();

        when(userRepository.save(any(User.class))).thenReturn(expectedUser);


        UserResponse response = userService.register(validRequest);


        assertNotNull(response, "Response should not be null");
        assertEquals(validRequest.id(), response.id(), "ID should match");
        assertEquals(validRequest.publicKey(), response.publicKey(), "Public key should match");

        verify(userRepository, times(1)).existsById(validRequest.id());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    public void testRegister_WithDuplicateId_ShouldThrowException() {

        when(userRepository.existsById(validRequest.id())).thenReturn(true);


        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> userService.register(validRequest),
                "Should throw IllegalArgumentException for duplicate ID");

        assertEquals("El ID ya estÃ¡ en uso.", exception.getMessage());
        verify(userRepository, times(1)).existsById(validRequest.id());
        verify(userRepository, never()).save(any(User.class));
    }
}
