package com.hermnet.api.service;

import com.hermnet.api.dto.RegisterRequest;
import com.hermnet.api.dto.UserResponse;
import com.hermnet.api.model.User;
import com.hermnet.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

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
}