package com.hermnet.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hermnet.api.config.SecurityConfig;
import com.hermnet.api.dto.SendMessageRequest;
import com.hermnet.api.security.JwtAuthenticationFilter;
import com.hermnet.api.security.JwtTokenProvider;
import com.hermnet.api.repository.MessageRepository;
import com.hermnet.api.model.Message;
import com.hermnet.api.config.IpAnonymizationFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(MessageController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
public class MessageControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MessageRepository messageRepository;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private IpAnonymizationFilter ipAnonymizationFilter;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    public void setup() throws Exception {
        doAnswer(invocation -> {
            HttpServletRequest req = invocation.getArgument(0);
            HttpServletResponse res = invocation.getArgument(1);
            FilterChain chain = invocation.getArgument(2);
            chain.doFilter(req, res);
            return null;
        }).when(ipAnonymizationFilter).doFilter(any(), any(), any());
    }

    @Test
    public void sendMessage_ShouldReturn403_WhenNoTokenProvided() throws Exception {
        SendMessageRequest request = new SendMessageRequest("HNET-VALID", new byte[] { 1, 2, 3 });

        mockMvc.perform(post("/api/messages")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    public void sendMessage_ShouldReturn202_WhenValidTokenProvided() throws Exception {
        SendMessageRequest request = new SendMessageRequest("HNET-VALID", new byte[] { 1, 2, 3 });
        String token = "valid.token";

        when(jwtTokenProvider.validateToken(token)).thenReturn(true);
        when(jwtTokenProvider.getUserIdFromToken(token)).thenReturn("user1");
        when(messageRepository.save(any(Message.class))).thenReturn(new Message());

        mockMvc.perform(post("/api/messages")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isAccepted());
    }
}
