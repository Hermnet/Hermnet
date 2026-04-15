package com.hermnet.api.dto;

/**
 * Reply for {@code POST /api/messages/ack}: how many mailbox rows were removed.
 */
public record AckResponse(long deleted) {
}
