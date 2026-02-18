package com.hermnet.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main entry point for the Hermnet API application.
 * 
 * Hermnet is a high-security, zero-knowledge messaging backend that prioritizes
 * user privacy and data protection through IP anonymization and encrypted
 * communications.
 * 
 * @author Hermnet Team
 * @version 1.0
 * @since 2025
 */
@SpringBootApplication
@EnableScheduling
public class HermnetApiApplication {

	/**
	 * Application entry point.
	 * 
	 * Bootstraps the Spring Boot application context and starts the embedded
	 * server.
	 * 
	 * @param args Command-line arguments passed to the application
	 */
	public static void main(String[] args) {
		SpringApplication.run(HermnetApiApplication.class, args);
	}

}
