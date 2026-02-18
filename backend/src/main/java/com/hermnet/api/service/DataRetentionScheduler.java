package com.hermnet.api.service;

import com.hermnet.api.repository.AuthChallengeRepository;
import com.hermnet.api.repository.BlacklistedTokenRepository;
import com.hermnet.api.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Scheduled task that enforces ephemeral data retention for privacy compliance.
 *
 * Every hour it removes:
 * - mailbox messages older than the configured retention window
 * - expired authentication challenges
 * - expired blacklisted tokens
 */
@Component
@RequiredArgsConstructor
public class DataRetentionScheduler {

    private final MessageRepository messageRepository;
    private final AuthChallengeRepository authChallengeRepository;
    private final BlacklistedTokenRepository blacklistedTokenRepository;

    @Value("${app.privacy.data-retention.mailbox-hours:24}")
    private long mailboxRetentionHours;

    @Scheduled(cron = "${app.privacy.data-retention.cleanup-cron:0 0 * * * *}")
    @Transactional
    public void purgeExpiredData() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime mailboxCutoff = now.minusHours(mailboxRetentionHours);

        messageRepository.deleteByCreatedAtBefore(mailboxCutoff);
        authChallengeRepository.deleteByExpiresAtBefore(now);
        blacklistedTokenRepository.deleteByExpiresAtBefore(now);
    }
}