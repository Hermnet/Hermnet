package com.hermnet.api.dto;

import java.time.LocalDateTime;

/**
 * Opaque mailbox entry returned to a recipient.
 *
 * @param payload   encrypted payload bytes; the server never decodes them.
 * @param createdAt server-side enqueue timestamp, used as an ACK cutoff.
 */
public record MailboxMessageResponse(byte[] payload, LocalDateTime createdAt) {
}
