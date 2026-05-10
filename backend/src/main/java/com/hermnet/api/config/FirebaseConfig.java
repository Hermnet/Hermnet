package com.hermnet.api.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Configuration for Firebase services.
 * 
 * Initializes the FirebaseApp with appropriate credentials for sending
 * Cloud Messaging (FCM) notifications. Supports multiple credential loading
 * strategies:
 * 1. JSON content from environment variables.
 * 2. File path from configuration.
 * 3. Application Default Credentials (ADC).
 */
@Configuration
@Slf4j
public class FirebaseConfig {

    @Value("${firebase.service.account.path:}")
    private String serviceAccountPath;

    @Value("${firebase.service.account.json:}")
    private String serviceAccountJson;

    /**
     * Initializes the FirebaseApp bean.
     * 
     * @return The initialized FirebaseApp instance.
     */
    @Bean
    public FirebaseApp firebaseApp() {
        if (FirebaseApp.getApps().isEmpty()) {
            GoogleCredentials credentials = resolveCredentials();
            if (credentials == null) {
                log.warn("Firebase credentials not configured. Push notifications are disabled for this run.");
                return null;
            }

            try {
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(credentials)
                        .build();
                return FirebaseApp.initializeApp(options);
            } catch (IllegalStateException e) {
                log.warn("Firebase could not be initialized. Push notifications are disabled: {}", e.getMessage());
                return null;
            }
        }
        return FirebaseApp.getInstance();
    }

    private GoogleCredentials resolveCredentials() {
        try {
            if (serviceAccountJson != null && !serviceAccountJson.isBlank()) {
                return GoogleCredentials.fromStream(
                        new ByteArrayInputStream(serviceAccountJson.getBytes(StandardCharsets.UTF_8)));
            }

            if (serviceAccountPath != null && !serviceAccountPath.isBlank()) {
                File credentialsFile = new File(serviceAccountPath);
                if (credentialsFile.isFile()) {
                    return GoogleCredentials.fromStream(new FileInputStream(credentialsFile));
                }
                log.info("Firebase service account file not found at {}", serviceAccountPath);
            }

            return GoogleCredentials.getApplicationDefault();
        } catch (IOException e) {
            log.info("Firebase credentials unavailable: {}", e.getMessage());
            return null;
        }
    }
}
