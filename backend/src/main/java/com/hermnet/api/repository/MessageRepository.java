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
     * time (oldest first).
     * 
     * This method is used when a client polls for new messages. The ordering
     * ensures the client processes a mailbox in enqueue order.
     * 
     * @param recipientHash The hashed ID of the user to retrieve messages for
     * @return A list of messages for the recipient, ordered by createdAt ascending
     */
    List<Message> findByRecipientHashOrderByCreatedAtAscMessageIdAsc(String recipientHash);

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

    /**
     * Bulk delete messages the recipient has acknowledged. A null cutoff removes
     * every message currently queued for the recipient.
     *
     * @param recipientHash Hashed id of the recipient.
     * @param cutoff        Newest createdAt timestamp to ack (inclusive).
     * @return number of deleted rows
     */
    long deleteByRecipientHashAndCreatedAtLessThanEqual(String recipientHash, LocalDateTime cutoff);

    /**
     * Deletes all queued mailbox rows for a recipient after the client confirms
     * they have been processed.
     *
     * @param recipientHash hashed id of the recipient
     * @return number of deleted rows
     */
    long deleteByRecipientHash(String recipientHash);
}
