package com.hermnet.api.dto;

import java.time.LocalDateTime;

/**
 * Body for {@code POST /api/messages/ack}. A null cutoff acknowledges every
 * message currently queued for the authenticated user.
 *
 * @param cutoff Newest message timestamp to ack (inclusive).
 */
public record AckRequest(LocalDateTime cutoff) {
}
