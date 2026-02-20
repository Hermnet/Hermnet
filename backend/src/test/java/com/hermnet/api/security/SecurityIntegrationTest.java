package com.hermnet.api.security;

import com.hermnet.api.repository.MessageRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.google.firebase.FirebaseApp;

@SpringBootTest
@AutoConfigureMockMvc
public class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;


    @MockBean
    private MessageRepository messageRepository;

    @MockBean(name = "firebaseApp")
    private FirebaseApp firebaseApp;

    @Test
    public void publicEndpoints_ShouldBeAccessibleWithoutToken() throws Exception {


        mockMvc.perform(post("/api/auth/register")
                .contentType("application/json")
                .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void protectedEndpoints_ShouldReturn401_WhenNoTokenProvided() throws Exception {

        mockMvc.perform(get("/api/messages?myId=test"))
                .andExpect(status().isForbidden());




    }

    @Test
    public void protectedEndpoints_ShouldReturn200_WhenValidTokenProvided() throws Exception {

        String token = jwtTokenProvider.generateToken("user-123");

        mockMvc.perform(get("/api/messages?myId=user-123")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }
}
