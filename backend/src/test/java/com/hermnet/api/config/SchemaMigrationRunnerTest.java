package com.hermnet.api.config;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

@ExtendWith(MockitoExtension.class)
class SchemaMigrationRunnerTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Test
    void run_ShouldNoop_WhenOldColumnMissing() {
        when(jdbcTemplate.queryForObject(anyString(), eq(Boolean.class))).thenReturn(false);

        new SchemaMigrationRunner(jdbcTemplate).run();

        verify(jdbcTemplate).queryForObject(anyString(), eq(Boolean.class));
    }

    @Test
    void run_ShouldCopyAndDropOldColumn_WhenBothColumnsExist() {
        when(jdbcTemplate.queryForObject(anyString(), eq(Boolean.class))).thenReturn(true, true);
        when(jdbcTemplate.update("UPDATE mailbox SET payload = stego_packet WHERE payload IS NULL"))
                .thenReturn(3);

        new SchemaMigrationRunner(jdbcTemplate).run();

        verify(jdbcTemplate).update("UPDATE mailbox SET payload = stego_packet WHERE payload IS NULL");
        verify(jdbcTemplate).execute("ALTER TABLE mailbox DROP COLUMN stego_packet");
    }

    @Test
    void run_ShouldRenameOldColumn_WhenPayloadColumnMissing() {
        when(jdbcTemplate.queryForObject(anyString(), eq(Boolean.class))).thenReturn(true, false);

        new SchemaMigrationRunner(jdbcTemplate).run();

        verify(jdbcTemplate).execute("ALTER TABLE mailbox RENAME COLUMN stego_packet TO payload");
    }

    @Test
    void run_ShouldSwallowMigrationErrors() {
        when(jdbcTemplate.queryForObject(anyString(), eq(Boolean.class)))
                .thenThrow(new IllegalStateException("metadata unavailable"));

        new SchemaMigrationRunner(jdbcTemplate).run();
    }
}
