package com.hermnet.api.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.ByteArrayInputStream;
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
public class FirebaseConfig {

    @Value("${firebase.service.account.path:}")
    private String serviceAccountPath;

    @Value("${firebase.service.account.json:}")
    private String serviceAccountJson;

    /**
     * Initializes the FirebaseApp bean.
     * 
     * @return The initialized FirebaseApp instance.
     * @throws IOException If there is an error reading the credentials.
     */
    @Bean
    public FirebaseApp firebaseApp() throws IOException {
        if (FirebaseApp.getApps().isEmpty()) {
            GoogleCredentials credentials;

            if (serviceAccountJson != null && !serviceAccountJson.isEmpty()) {
                credentials = GoogleCredentials.fromStream(
                        new ByteArrayInputStream(serviceAccountJson.getBytes(StandardCharsets.UTF_8)));
            } else if (serviceAccountPath != null && !serviceAccountPath.isEmpty()) {
                credentials = GoogleCredentials.fromStream(new FileInputStream(serviceAccountPath));
            } else {
                credentials = GoogleCredentials.getApplicationDefault();
            }

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(credentials)
                    .build();

            return FirebaseApp.initializeApp(options);
        }
        return FirebaseApp.getInstance();
    }
}
