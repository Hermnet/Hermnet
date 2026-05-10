package com.hermnet.api.service;

import com.hermnet.api.dto.RegisterRequest;
import com.hermnet.api.dto.UserResponse;
import com.hermnet.api.model.User;
import com.hermnet.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Service layer for managing User operations.
 * 
 * Handles business logic for user registration, including checking for duplicate IDs.
 * Format validation (HNET prefix) is handled by the Controller layer via DTO annotations.
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    /**
     * Registers a new user.
     * 
     * Creates a new User entity from the provided request data and persists it to the database.
     * Checks if the user ID already exists before saving to prevent duplicates.
     * 
     * @param request The registration request containing user details (ID, public key, push token).
     * @return A UserResponse DTO with the registered user's details.
     * @throws IllegalArgumentException if the user ID is already in use.
     */
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsById(request.id())) {
            throw new IllegalArgumentException("El ID ya está en uso.");
        }
        
        User newUser = User.builder()
                .idHash(request.id())
                .publicKey(request.publicKey())
                .pushToken(request.pushToken()) 
                .build();

        User savedUser = userRepository.save(newUser);

        return new UserResponse(
                savedUser.getIdHash(),
                savedUser.getPublicKey(),
                savedUser.getCreatedAt()
        );
    }

    public UserResponse findPublicIdentity(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado."));
        return new UserResponse(user.getIdHash(), user.getPublicKey(), user.getCreatedAt());
    }

    public void updatePushToken(String id, String pushToken) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado."));
        String cleanToken = pushToken == null || pushToken.isBlank() ? null : pushToken.trim();
        user.setPushToken(cleanToken);
        userRepository.save(user);
    }
}
