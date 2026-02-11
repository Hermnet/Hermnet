package com.hermnet.api.model;

import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for Message entity.
 * 
 * Verifies builder functionality, lifecycle callbacks, and edge cases.
 * Updated to match the current entity structure (messageId, recipientHash,
 * stegoPacket).
 */
public class MessageTest {

    @Test
    public void testBuilder() {
        // Given
        String recipientHash = "abcefg123hash-recipient";
        byte[] stegoPacket = new byte[] { 1, 2, 3, 4, 5 };

        // When
        Message message = Message.builder()
                .recipientHash(recipientHash)
                .stegoPacket(stegoPacket)
                .build();

        // Then
        assertEquals(recipientHash, message.getRecipientHash());
        assertArrayEquals(stegoPacket, message.getStegoPacket());
        assertNull(message.getMessageId(), "ID should be null before persistence");
    }

    @Test
    public void testOnCreate_ShouldSetTimestamp() {
        // Given
        Message message = new Message();
        assertNull(message.getCreatedAt(), "CreatedAt should be null initially");

        // When
        // Simulate what JPA does before persisting
        message.onCreate();

        // Then
        assertNotNull(message.getCreatedAt(), "CreatedAt timestamp should be generated");
    }

    @Test
    public void testNoArgsConstructor() {
        // When
        Message msg = new Message();

        // Then
        assertNotNull(msg);
        assertNull(msg.getRecipientHash());
        assertNull(msg.getStegoPacket());
    }

    @Test
    public void testAllArgsConstructor() {
        // Given
        Long id = 1L;
        String recipientHash = "recipient-hash-123";
        byte[] stegoPacket = new byte[] { 10, 20, 30 };
        LocalDateTime now = LocalDateTime.now();

        // When
        Message msg = new Message(id, recipientHash, stegoPacket, now);

        // Then
        assertEquals(id, msg.getMessageId());
        assertEquals(recipientHash, msg.getRecipientHash());
        assertArrayEquals(stegoPacket, msg.getStegoPacket());
        assertEquals(now, msg.getCreatedAt());
    }

    @Test
    public void testGettersAndSetters() {
        // Given
        Message msg = new Message();
        String recipientHash = "HNET-SETTER-HASH";
        byte[] packet = new byte[] { 0, 1 };

        // When
        msg.setMessageId(100L);
        msg.setRecipientHash(recipientHash);
        msg.setStegoPacket(packet);

        // Then
        assertEquals(100L, msg.getMessageId());
        assertEquals(recipientHash, msg.getRecipientHash());
        assertArrayEquals(packet, msg.getStegoPacket());
    }
}
