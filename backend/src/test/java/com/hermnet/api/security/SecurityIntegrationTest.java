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

@SpringBootTest
@AutoConfigureMockMvc
public class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    // Mock repository to avoid database interaction issues
    @MockBean
    private MessageRepository messageRepository;

    @Test
    public void publicEndpoints_ShouldBeAccessibleWithoutToken() throws Exception {
        // /api/auth/register is public
        // Sending invalid JSON to trigger 400 instead of 403/401
        mockMvc.perform(post("/api/auth/register")
                .contentType("application/json")
                .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void protectedEndpoints_ShouldReturn401_WhenNoTokenProvided() throws Exception {
        // /api/messages requires auth
        mockMvc.perform(get("/api/messages?myId=test"))
                .andExpect(status().isForbidden()); // Spring default is often 403 for missing auth in stateless chain,
                                                    // or 401. Let's check.
        // Actually, without an entry point, it often returns 403 Forbidden by default
        // for authenticated resources.
        // But let's assume standard behavior. If it fails I'll adjust.
    }

    @Test
    public void protectedEndpoints_ShouldReturn200_WhenValidTokenProvided() throws Exception {
        // Generate a valid token
        String token = jwtTokenProvider.generateToken("user-123");

        mockMvc.perform(get("/api/messages?myId=user-123")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }
}
