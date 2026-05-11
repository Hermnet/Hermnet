package com.hermnet.api.controller;

import com.hermnet.api.dto.PushTokenRequest;
import com.hermnet.api.dto.UserResponse;
import com.hermnet.api.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserControllerTest {

    private final UserService userService = mock(UserService.class);
    private final UserController controller = new UserController(userService);

    @Test
    void findById_ShouldReturnPublicIdentity() {
        UserResponse response = new UserResponse("HNET-USER", "public-key", LocalDateTime.now());
        when(userService.findPublicIdentity("HNET-USER")).thenReturn(response);

        ResponseEntity<UserResponse> result = controller.findById("HNET-USER");

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertEquals(response, result.getBody());
    }

    @Test
    void updatePushToken_ShouldReturn401_WhenPrincipalMissing() {
        ResponseEntity<Void> result = controller.updatePushToken(" ", new PushTokenRequest("token"));

        assertEquals(HttpStatus.UNAUTHORIZED, result.getStatusCode());
    }

    @Test
    void updatePushToken_ShouldStoreNull_WhenRequestMissing() {
        ResponseEntity<Void> result = controller.updatePushToken("HNET-USER", null);

        assertEquals(HttpStatus.NO_CONTENT, result.getStatusCode());
        verify(userService).updatePushToken("HNET-USER", null);
    }

    @Test
    void updatePushToken_ShouldStoreToken_WhenRequestPresent() {
        ResponseEntity<Void> result = controller.updatePushToken("HNET-USER", new PushTokenRequest("token"));

        assertEquals(HttpStatus.NO_CONTENT, result.getStatusCode());
        verify(userService).updatePushToken("HNET-USER", "token");
    }

    @Test
    void handleBadRequests_ShouldReturnMessage() {
        ResponseEntity<String> result = controller.handleBadRequests(new IllegalArgumentException("bad request"));

        assertEquals(HttpStatus.BAD_REQUEST, result.getStatusCode());
        assertEquals("bad request", result.getBody());
    }
}
