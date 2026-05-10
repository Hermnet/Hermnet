package com.hermnet.api.dto;

/**
 * DTO for updating the device push token of the authenticated user.
 *
 * @param pushToken FCM/APNs token, or null/blank to disable push for the user.
 */
public record PushTokenRequest(String pushToken) {
}
