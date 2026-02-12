package com.hermnet.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
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

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(MessageController.class)
@AutoConfigureMockMvc(addFilters = false)
public class MessageControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MessageRepository messageRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void sendMessage_ShouldReturn202_WhenRequestIsValid() throws Exception {
        SendMessageRequest request = new SendMessageRequest("HNET-VALID", new byte[] { 1, 2, 3 });

        when(messageRepository.save(any(Message.class))).thenReturn(new Message());

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
