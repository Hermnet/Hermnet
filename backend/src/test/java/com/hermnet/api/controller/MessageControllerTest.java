package com.hermnet.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hermnet.api.config.RateLimitFilter;
import com.hermnet.api.dto.SendMessageRequest;
import com.hermnet.api.model.Message;
import com.hermnet.api.repository.MessageRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.hermnet.api.model.User;
import com.hermnet.api.repository.UserRepository;
import com.hermnet.api.service.NotificationService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.AfterEach;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.Collections;

@WebMvcTest(MessageController.class)
@AutoConfigureMockMvc(addFilters = false)
public class MessageControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MessageRepository messageRepository;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private NotificationService notificationService;

    @MockBean
    private com.hermnet.api.security.JwtTokenProvider jwtTokenProvider;

    @MockBean
    private com.hermnet.api.service.TokenBlacklistService tokenBlacklistService;

    @MockBean
    private RateLimitFilter rateLimitFilter;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void sendMessage_ShouldReturn202_AndTriggerNotification_WhenRequestIsValid() throws Exception {
        SendMessageRequest request = new SendMessageRequest("HNET-VALID", new byte[] { 1, 2, 3 });
        User mockUser = new User();
        mockUser.setPushToken("test-push-token");

        when(messageRepository.save(any(Message.class))).thenReturn(new Message());
        when(userRepository.findById("HNET-VALID")).thenReturn(Optional.of(mockUser));

        mockMvc.perform(post("/api/messages")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isAccepted());
    }

    @Test
    public void sendMessage_ShouldReturn400_WhenRecipientIdIsBlank() throws Exception {
        SendMessageRequest request = new SendMessageRequest("", new byte[] { 1, 2, 3 });

        mockMvc.perform(post("/api/messages")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void sendMessage_ShouldReturn400_WhenStegoImageIsEmpty() throws Exception {
        SendMessageRequest request = new SendMessageRequest("HNET-VALID", new byte[] {});

        mockMvc.perform(post("/api/messages")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void sendMessage_ShouldReturn400_WhenStegoImageIsNull() throws Exception {
        SendMessageRequest request = new SendMessageRequest("HNET-VALID", null);

        mockMvc.perform(post("/api/messages")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @AfterEach
    public void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateAs(String userId) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList()));
    }

    @Test
    public void ackMessages_ShouldDeleteAll_WhenCutoffMissing() throws Exception {
        String userId = "HNET-USER-1";
        authenticateAs(userId);
        when(messageRepository.deleteByRecipientHash(userId)).thenReturn(3L);

        mockMvc.perform(post("/api/messages/ack")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deleted").value(3));

        verify(messageRepository).deleteByRecipientHash(userId);
    }

    @Test
    public void ackMessages_ShouldDeleteUpToCutoff_WhenCutoffProvided() throws Exception {
        String userId = "HNET-USER-2";
        String cutoff = "2026-04-15T10:00:00";
        authenticateAs(userId);
        when(messageRepository.deleteByRecipientHashAndCreatedAtLessThanEqual(
                eq(userId), any(LocalDateTime.class))).thenReturn(2L);

        mockMvc.perform(post("/api/messages/ack")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"cutoff\":\"" + cutoff + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deleted").value(2));

        verify(messageRepository).deleteByRecipientHashAndCreatedAtLessThanEqual(
                eq(userId), any(LocalDateTime.class));
    }

    @Test
    public void getMessages_ShouldReturnList_WhenUserHasMessages() throws Exception {
        String myId = "HNET-VALID";
        Message msg1 = Message.builder().stegoPacket(new byte[] { 1 }).createdAt(LocalDateTime.now()).build();
        Message msg2 = Message.builder().stegoPacket(new byte[] { 2 }).createdAt(LocalDateTime.now()).build();

        when(messageRepository.findByRecipientHashOrderByCreatedAtDesc(myId))
                .thenReturn(List.of(msg1, msg2));

        mockMvc.perform(get("/api/messages")
                .param("myId", myId))
                .andExpect(status().isOk());
    }
}
