package com.hermnet.api.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI metadata for the public API documentation.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI hermnetOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Hermnet API")
                        .version("1.0.0")
                        .description("REST API for Hermnet zero-knowledge encrypted messaging.")
                        .license(new License().name("Academic project")))
                .components(new Components()
                        .addSecuritySchemes("bearer-jwt",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("JWT issued by the challenge-response login flow.")));
    }
}
