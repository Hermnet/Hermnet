package com.hermnet.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hermnet.api.dto.ChallengeRequest;
import com.hermnet.api.dto.ChallengeResponse;
import com.hermnet.api.dto.LoginRequest;
import com.hermnet.api.dto.LoginResponse;
import com.hermnet.api.dto.RegisterRequest;
import com.hermnet.api.dto.UserResponse;
import com.hermnet.api.config.RateLimitFilter;
import com.hermnet.api.service.AuthService;
import com.hermnet.api.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
public class AuthControllerTest {

        @Autowired
        private MockMvc mockMvc;

        @MockBean
        private UserService userService;

        @MockBean
        private AuthService authService;

        @MockBean
        private com.hermnet.api.security.JwtTokenProvider jwtTokenProvider;

        @MockBean
        private RateLimitFilter rateLimitFilter;

        @Autowired
        private ObjectMapper objectMapper;

        @Test
        public void register_ShouldReturn201_WhenRequestIsValid() throws Exception {
                RegisterRequest request = new RegisterRequest(
                                "HNET-VALID1",
                                "valid-public-key",
                                "push-token");

                UserResponse mockResponse = new UserResponse(
                                "HNET-VALID1",
                                "valid-public-key",
                                LocalDateTime.now());

                when(userService.register(any(RegisterRequest.class))).thenReturn(mockResponse);

                mockMvc.perform(post("/api/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.id").value("HNET-VALID1"))
                                .andExpect(jsonPath("$.publicKey").value("valid-public-key"));
        }

        @Test
        public void register_ShouldReturn400_WhenIdFormatIsInvalid() throws Exception {
                RegisterRequest request = new RegisterRequest(
                                "INVALID-ID",
                                "valid-public-key",
                                null);

                mockMvc.perform(post("/api/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest());
        }

        @Test
        public void register_ShouldReturn400_WhenIdIsTooShort() throws Exception {
                RegisterRequest request = new RegisterRequest(
                                "HNET-1234",
                                "valid-public-key",
                                null);

                mockMvc.perform(post("/api/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest());
        }

        @Test
        public void register_ShouldReturn400_WhenPublicKeyIsMissing() throws Exception {
                RegisterRequest request = new RegisterRequest(
                                "HNET-VALID2",
                                "", 
                                null);

                mockMvc.perform(post("/api/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest());
        }

        @Test
        public void register_ShouldReturn400_WhenServiceThrowsException() throws Exception {
                RegisterRequest request = new RegisterRequest(
                                "HNET-DUPLICATE",
                                "key",
                                null);

                when(userService.register(any(RegisterRequest.class)))
                                .thenThrow(new IllegalArgumentException("El ID ya está en uso."));

                mockMvc.perform(post("/api/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$").value("El ID ya está en uso."));
        }

        @Test
        public void login_ShouldReturnToken_WhenCredentialsAreValid() throws Exception {
                LoginRequest request = new LoginRequest("valid-nonce", "valid-signature");
                LoginResponse response = new LoginResponse("valid.jwt.token");

                when(authService.login(any(LoginRequest.class))).thenReturn(response);

                mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.token").value("valid.jwt.token"));
        }

        @Test
        public void challenge_ShouldReturnNonce_WhenRequestIsValid() throws Exception {
                ChallengeRequest request = new ChallengeRequest("HNET-VALID1");
                ChallengeResponse response = new ChallengeResponse("nonce-value");

                when(authService.challenge(any(ChallengeRequest.class))).thenReturn(response);

                mockMvc.perform(post("/api/auth/challenge")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.nonce").value("nonce-value"));
        }

        @Test
        public void login_ShouldReturn400_WhenCredentialsAreInvalid() throws Exception {
                LoginRequest request = new LoginRequest("invalid-nonce", "invalid-signature");

                when(authService.login(any(LoginRequest.class)))
                                .thenThrow(new IllegalArgumentException("Invalid credentials"));

                mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$").value("Invalid credentials"));
        }
}
