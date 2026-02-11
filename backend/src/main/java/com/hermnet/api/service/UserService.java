package com.hermnet.api.service;

import com.hermnet.api.model.User;
import com.hermnet.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Service layer for managing User operations.
 * 
 * This service handles the business logic for user registration and management
 * in the Hermnet system. It enforces validation rules and ensures data
 * integrity
 * before persisting users to the database.
 * 
 * Key responsibilities:
 * - Validate user ID format (must start with "HNET-")
 * - Ensure user IDs are unique
 * - Ensure public keys are unique
 * - Coordinate with UserRepository for data persistence
 * 
 * @see User
 * @see UserRepository
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    /**
     * Registers a new user in the Hermnet system.
     * 
     * This method performs the following validations:
     * 1. Validates that the user ID follows the required format (starts with
     * "HNET-")
     * 2. Checks that the user ID is not already registered
     * 3. Verifies that the public key is not already in use by another user
     * 
     * If all validations pass, creates and persists a new User entity with
     * the provided credentials. The createdAt timestamp is automatically
     * generated via the @PrePersist lifecycle callback.
     * 
     * @param id        The unique identifier for the user (must start with "HNET-")
     * @param publicKey The user's public encryption key (must be unique)
     * @return The newly created and persisted User entity
     * @throws IllegalArgumentException if the user ID format is invalid
     * @throws IllegalStateException    if the user ID already exists
     * @throws IllegalStateException    if the public key is already in use
     */
    public User registerUser(String id, String publicKey) {
        // Validate ID format - must follow Hermnet naming convention
        if (!id.startsWith("HNET-")) {
            throw new IllegalArgumentException("Invalid user ID format");
        }

        // Check for duplicate user ID
        if (userRepository.existsById(id)) {
            throw new IllegalStateException("User already exists");
        }

        // Check for duplicate public key
        if (userRepository.findByPublicKey(publicKey).isPresent()) {
            throw new IllegalStateException("This public key is already in use");
        }

        // Create new user entity
        User newUser = User.builder()
                .idHash(id)
                .publicKey(publicKey)
                .build();

        // Persist and return the new user
        return userRepository.save(newUser);
    }
}
