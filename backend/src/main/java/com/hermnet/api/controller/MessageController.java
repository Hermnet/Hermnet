package com.hermnet.api.controller;

import com.hermnet.api.dto.AckRequest;
import com.hermnet.api.dto.AckResponse;
import com.hermnet.api.dto.SendMessageRequest;
import com.hermnet.api.model.Message;
import com.hermnet.api.model.User;
import com.hermnet.api.repository.MessageRepository;
import com.hermnet.api.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Controller for secure message exchange.
 *
 * Handles storing encrypted messages for recipients and retrieving them.
 * Messages are treated as opaque encrypted payloads.
 */
@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final com.hermnet.api.service.NotificationService notificationService;

    /**
     * Sends a secure message to a recipient.
     *
     * Stores the encrypted payload in the recipient's mailbox. The server does
     * not know the sender or the content. Triggers a silent "Data-Only" push
     * notification (FCM) to the recipient to initiate background sync.
     *
     * @param request The message request containing recipient ID and encrypted payload.
     * @return 202 Accepted if the message is successfully queued/stored.
     */
    @PostMapping
    public ResponseEntity<Void> sendMessage(@Valid @RequestBody SendMessageRequest request) {
        Message message = Message.builder()
                .recipientHash(request.recipientId())
                .payload(request.payload())
                .build();

        messageRepository.save(message);

        userRepository.findById(request.recipientId())
                .map(User::getPushToken)
                .ifPresent(notificationService::sendSyncNotification);

        return ResponseEntity.accepted().build();
    }

    /**
     * Retrieves messages for a user.
     *
     * Returns a list of encrypted payloads intended for the user, ordered by
     * arrival time (newest first).
     *
     * @param myId The user's ID hash to retrieve messages for.
     * @return List of encrypted payloads (as byte arrays / Base64 strings).
     */
    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<byte[]>> getMessages(@RequestParam String myId) {
        List<Message> messages = messageRepository.findByRecipientHashOrderByCreatedAtDesc(myId);

        List<byte[]> payloads = messages.stream()
                .map(Message::getPayload)
                .collect(Collectors.toList());

        return ResponseEntity.ok(payloads);
    }

    /**
     * Acknowledges (and deletes) mailbox messages for the authenticated user.
     *
     * When {@link AckRequest#cutoff()} is provided, only messages with
     * {@code createdAt <= cutoff} are removed so new arrivals between poll and
     * ack are preserved. Null cutoff wipes every queued message for the caller.
     *
     * @param principal Authenticated user id (JWT subject).
     * @param request   Body with optional cutoff timestamp.
     * @return number of rows removed.
     */
    @PostMapping("/ack")
    @Transactional
    public ResponseEntity<AckResponse> ackMessages(
            @AuthenticationPrincipal String principal,
            @RequestBody(required = false) AckRequest request) {
        if (principal == null || principal.isBlank()) {
            return ResponseEntity.status(401).build();
        }

        long deleted;
        if (request != null && request.cutoff() != null) {
            deleted = messageRepository
                    .deleteByRecipientHashAndCreatedAtLessThanEqual(principal, request.cutoff());
        } else {
            deleted = messageRepository.deleteByRecipientHash(principal);
        }

        return ResponseEntity.ok(new AckResponse(deleted));
    }
}
