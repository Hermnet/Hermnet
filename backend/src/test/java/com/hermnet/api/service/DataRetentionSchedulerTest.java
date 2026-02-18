package com.hermnet.api.service;

import com.hermnet.api.repository.AuthChallengeRepository;
import com.hermnet.api.repository.BlacklistedTokenRepository;
import com.hermnet.api.repository.MessageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class DataRetentionSchedulerTest {

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private AuthChallengeRepository authChallengeRepository;

    @Mock
    private BlacklistedTokenRepository blacklistedTokenRepository;

    private DataRetentionScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new DataRetentionScheduler(
                messageRepository,
                authChallengeRepository,
                blacklistedTokenRepository);
        ReflectionTestUtils.setField(scheduler, "mailboxRetentionHours", 24L);
    }

    @Test
    void shouldPurgeMailboxChallengesAndTokens() {
        LocalDateTime beforeExecution = LocalDateTime.now();

        scheduler.purgeExpiredData();

        LocalDateTime afterExecution = LocalDateTime.now();

        ArgumentCaptor<LocalDateTime> mailboxCutoffCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        ArgumentCaptor<LocalDateTime> challengeCutoffCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        ArgumentCaptor<LocalDateTime> tokenCutoffCaptor = ArgumentCaptor.forClass(LocalDateTime.class);

        verify(messageRepository).deleteByCreatedAtBefore(mailboxCutoffCaptor.capture());
        verify(authChallengeRepository).deleteByExpiresAtBefore(challengeCutoffCaptor.capture());
        verify(blacklistedTokenRepository).deleteByExpiresAtBefore(tokenCutoffCaptor.capture());

        LocalDateTime mailboxCutoff = mailboxCutoffCaptor.getValue();
        LocalDateTime challengeCutoff = challengeCutoffCaptor.getValue();
        LocalDateTime tokenCutoff = tokenCutoffCaptor.getValue();

        assertTrue(!mailboxCutoff.isAfter(afterExecution.minusHours(24))
                        && !mailboxCutoff.isBefore(beforeExecution.minusHours(24)),
                "Mailbox cutoff must be now minus 24 hours");

        assertTrue(!challengeCutoff.isBefore(beforeExecution) && !challengeCutoff.isAfter(afterExecution),
                "Challenge cutoff must be current time");

        assertTrue(!tokenCutoff.isBefore(beforeExecution) && !tokenCutoff.isAfter(afterExecution),
                "Token cutoff must be current time");
    }
}