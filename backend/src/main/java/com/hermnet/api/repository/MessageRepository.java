package com.hermnet.api.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hermnet.api.model.Message;

/**
 * Repository interface for Message entity database operations.
 * 
 * Provides methods to store and retrieve secure, end-to-end encrypted messages.
 */
public interface MessageRepository extends JpaRepository<Message, Long> {

    /**
     * Retrieves all messages for a specific recipient hash, ordered by creation
     * time (newest first).
     * 
     * This method is used when a client polls for new messages. The ordering
     * ensures
     * that the most recent communications appear at the top of the list.
     * 
     * @param recipientHash The hashed ID of the user to retrieve messages for
     * @return A list of messages for the recipient, ordered by createdAt descending
     */
    List<Message> findByRecipientHashOrderByCreatedAtDesc(String recipientHash);

    /**
     * Deletes all messages created before a specific timestamp.
     * 
     * This is crucial for data retention policies and ensuring that ephemeral
     * messages
     * are purged from the system after a set period.
     * 
     * @param expiryDate The timestamp threshold; messages older than this will be
     *                   deleted
     */
    void deleteByCreatedAtBefore(LocalDateTime expiryDate);
}
