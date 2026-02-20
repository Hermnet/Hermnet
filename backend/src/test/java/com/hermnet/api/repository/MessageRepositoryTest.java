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

        Message msg = Message.builder()
                .recipientHash(RECIPIENT_HASH)
                .stegoPacket(STEGO_DATA)

                .build();


        Message saved = messageRepository.save(msg);


        assertNotNull(saved.getMessageId());
        assertNotNull(saved.getCreatedAt());

        List<Message> allMessages = messageRepository.findAll();
        assertEquals(1, allMessages.size());
        assertEquals(RECIPIENT_HASH, allMessages.get(0).getRecipientHash());
        assertArrayEquals(STEGO_DATA, allMessages.get(0).getStegoPacket());
    }

    @Test
    public void testFindByRecipientHashOrderedByCreatedAtDesc() {















        Message oldMsg = Message.builder()
                .recipientHash(RECIPIENT_HASH)
                .stegoPacket(new byte[] { 1 })
                .build();
        messageRepository.save(oldMsg);


        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
        }

        Message newMsg = Message.builder()
                .recipientHash(RECIPIENT_HASH)
                .stegoPacket(new byte[] { 2 })
                .build();
        messageRepository.save(newMsg);


        messageRepository.save(Message.builder()
                .recipientHash("OTHER-USER-HASH")
                .stegoPacket(new byte[] { 3 })
                .build());







        List<Message> found = messageRepository.findByRecipientHashOrderByCreatedAtDesc(RECIPIENT_HASH);






        assertEquals(2, found.size(), "Should find 2 messages for this recipient");



        assertArrayEquals(newMsg.getStegoPacket(), found.get(0).getStegoPacket(), "Newest message should be first");
        assertArrayEquals(oldMsg.getStegoPacket(), found.get(1).getStegoPacket(), "Older message should be second");
    }

    @Test
    public void testDeleteByCreatedAtBefore() {

        Message msg = Message.builder()
                .recipientHash(RECIPIENT_HASH)
                .stegoPacket(STEGO_DATA)
                .build();
        msg = messageRepository.save(msg);



        LocalDateTime threshold = LocalDateTime.now().plusSeconds(1);
        messageRepository.deleteByCreatedAtBefore(threshold);


        List<Message> remaining = messageRepository.findAll();
        assertTrue(remaining.isEmpty(), "Message should be deleted");
    }
}
