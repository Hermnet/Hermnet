package com.hermnet.api.controller;

import com.hermnet.api.dto.PushTokenRequest;
import com.hermnet.api.dto.UserResponse;
import com.hermnet.api.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-jwt")
@Tag(name = "Users", description = "Public identity lookup and device push registration")
public class UserController {

    private final UserService userService;

    @GetMapping("/{id}")
    @Operation(summary = "Find a public Hermnet identity by HNET id")
    public ResponseEntity<UserResponse> findById(@PathVariable String id) {
        return ResponseEntity.ok(userService.findPublicIdentity(id));
    }

    @PutMapping("/me/push-token")
    @Operation(summary = "Update the current user's push notification token")
    public ResponseEntity<Void> updatePushToken(
            @AuthenticationPrincipal String principal,
            @RequestBody(required = false) PushTokenRequest request) {
        if (principal == null || principal.isBlank()) {
            return ResponseEntity.status(401).build();
        }
        userService.updatePushToken(principal, request == null ? null : request.pushToken());
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleBadRequests(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}
