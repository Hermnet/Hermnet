package com.hermnet.api.service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private static final String ACTION_KEY = "action";
    private static final String ACTION_SYNC = "SYNC_REQUIRED";

    /**
     * Sends a silent "Data-Only" push notification to the recipient.
     * This wakes up the app in the background without showing a visual alert
     * according to Zero-Knowledge principles.
     * 
     * @param recipientToken The FCM registration token of the recipient device.
     */
    public void sendSyncNotification(String recipientToken) {
        if (recipientToken == null || recipientToken.isEmpty()) {
            log.warn("Cannot send notification: Recipient token is null or empty.");
            return;
        }

        try {
            Message message = Message.builder()
                    .setToken(recipientToken)
                    .putData(ACTION_KEY, ACTION_SYNC)
                    .build();

            String response = FirebaseMessaging.getInstance().send(message);
            log.info("Sent silent sync notification to token {}: {}",
                    recipientToken.substring(0, Math.min(10, recipientToken.length())) + "...", response);
        } catch (Exception e) {
            log.error("Failed to send FCM notification to token {}", recipientToken, e);
        }
    }
}
