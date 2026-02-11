package com.hermnet.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hermnet.api.model.AuthChallenge;
import com.hermnet.api.model.User;

public interface AuthChallengeRepository extends JpaRepository<AuthChallenge, String> {
    void deleteByUser(User user);
}
