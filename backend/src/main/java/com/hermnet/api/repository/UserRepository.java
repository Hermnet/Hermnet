package com.hermnet.api.repository;

import java.util.Optional;
import com.hermnet.api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository interface for User entity database operations.
 * 
 * Extends JpaRepository to provide standard CRUD operations and custom query
 * methods
 * for managing User entities in the database.
 * 
 * @see User
 * @see JpaRepository
 */
@Repository
public interface UserRepository extends JpaRepository<User, String> {

    /**
     * Finds a user by their public key.
     * 
     * This method enables lookup of users using their unique public encryption key,
     * which is essential for verifying user identity in the zero-knowledge
     * architecture.
     * 
     * @param publicKey The public encryption key to search for
     * @return An Optional containing the User if found, or empty if no user exists
     *         with that key
     */
    Optional<User> findByPublicKey(String publicKey);
}