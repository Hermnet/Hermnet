package com.hermnet.api.repository;

import com.hermnet.api.model.Message;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for MessageRepository.
 * 
 * Verifies storing, retrieving encrypted messages, and custom ordering by
 * creation time.
 * Updated to reflect schema changes: recipientHash, stegoPacket.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
public class MessageRepositoryTest {

    @Autowired
    private MessageRepository messageRepository;

    private static final String RECIPIENT_HASH = "HNET-TEST-RECIPIENT-HASH";
    private static final byte[] STEGO_DATA = new byte[] { 1, 2, 3, 4, 5 };

    @BeforeEach
    public void setUp() {
        messageRepository.deleteAll();
    }

    @Test
    public void testSaveAndRetrieveMessage() {
        // Given
        Message msg = Message.builder()
                .recipientHash(RECIPIENT_HASH)
                .stegoPacket(STEGO_DATA)
                // createdAt will be set by @PrePersist
                .build();

        // When
        Message saved = messageRepository.save(msg);

        // Then
        assertNotNull(saved.getMessageId());
        assertNotNull(saved.getCreatedAt());

        List<Message> allMessages = messageRepository.findAll();
        assertEquals(1, allMessages.size());
        assertEquals(RECIPIENT_HASH, allMessages.get(0).getRecipientHash());
        assertArrayEquals(STEGO_DATA, allMessages.get(0).getStegoPacket());
    }

    @Test
    public void testFindByRecipientHashOrderedByCreatedAtDesc() {
        // Given - Create messages at different times
        // Note: Using Thread.sleep or setting time manually to ensure different
        // timestamps
        // Ideally we would mock time, but here we set createdAt manually (if allowed)
        // or rely on sleep.
        // The entity has updatable=false on createdAt, but we can set it in builder
        // before save?
        // Let's rely on saving sequence or different data.

        // Wait can be unreliable, so let's try creating with manual timestamps if
        // possible
        // But the builder fields are usually overwritten by @PrePersist if logic forces
        // it.
        // Let's create one, then another.

        Message oldMsg = Message.builder()
                .recipientHash(RECIPIENT_HASH)
                .stegoPacket(new byte[] { 1 })
                .build();
        messageRepository.save(oldMsg);

        // Small delay to ensure timestamp difference
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
        }

        Message newMsg = Message.builder()
                .recipientHash(RECIPIENT_HASH)
                .stegoPacket(new byte[] { 2 })
                .build();
        messageRepository.save(newMsg);

        // And create a message for another user
        messageRepository.save(Message.builder()
                .recipientHash("OTHER-USER-HASH")
                .stegoPacket(new byte[] { 3 })
                .build());

        // When - Find for our recipient (using the correct method name)
        // Assuming repository method is findByRecipientHashOrderByCreatedAtDesc
        // Wait, previously it was findByRecipientId... I need to check repository
        // interface name.
        // Step 288 showed MessageRepository had findByRecipientIdOrderByCreatedAtDesc?
        // Let's check logic: RecipientHash is the field. Method needs to match.
        List<Message> found = messageRepository.findByRecipientHashOrderByCreatedAtDesc(RECIPIENT_HASH);
        // Note: If I didn't update the repository method NAME, it might fail or look
        // for recipientId field (which doesn't exist).
        // I need to update MessageRepository interface too. but first let's see current
        // code.

        // Then
        assertEquals(2, found.size(), "Should find 2 messages for this recipient");

        // Check order (newest first)
        // Since we don't have senderHash anymore, verify by stego content
        assertArrayEquals(newMsg.getStegoPacket(), found.get(0).getStegoPacket(), "Newest message should be first");
        assertArrayEquals(oldMsg.getStegoPacket(), found.get(1).getStegoPacket(), "Older message should be second");
    }

    @Test
    public void testDeleteByCreatedAtBefore() {
        // Given
        Message msg = Message.builder()
                .recipientHash(RECIPIENT_HASH)
                .stegoPacket(STEGO_DATA)
                .build();
        msg = messageRepository.save(msg);

        // When
        // Delete messages older than now + 1 second (which includes our message)
        LocalDateTime threshold = LocalDateTime.now().plusSeconds(1);
        messageRepository.deleteByCreatedAtBefore(threshold);

        // Then
        List<Message> remaining = messageRepository.findAll();
        assertTrue(remaining.isEmpty(), "Message should be deleted");
    }
}
