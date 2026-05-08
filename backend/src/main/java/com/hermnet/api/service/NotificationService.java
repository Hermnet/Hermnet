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

            FirebaseMessaging.getInstance().send(message);
            // Log redactado: solo confirmamos que se envió. NO logueamos el token completo
            // (es PII que identifica al dispositivo en los servidores de Google) ni la
            // respuesta de FCM (puede contener el messageId que también es correlable).
            if (log.isDebugEnabled()) {
                log.debug("FCM sync notification sent (token={})", redact(recipientToken));
            }
        } catch (Exception e) {
            // Mismo principio en errores: redactamos el token.
            log.error("Failed to send FCM notification (token={}): {}",
                    redact(recipientToken), e.getMessage());
        }
    }

    private static String redact(String token) {
        if (token == null || token.length() < 6) return "***";
        return token.substring(0, 4) + "***";
    }
}
