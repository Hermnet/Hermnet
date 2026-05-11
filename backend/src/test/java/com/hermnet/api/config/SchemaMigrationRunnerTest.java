package com.hermnet.api.config;

import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;

import javax.sql.DataSource;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

@ExtendWith(MockitoExtension.class)
class SchemaMigrationRunnerTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private DataSource dataSource;

    @Mock
    private Connection connection;

    @Mock
    private DatabaseMetaData metaData;

    @Test
    void run_ShouldNoop_WhenOldColumnMissing() throws Exception {
        mockColumns(false, false);

        new SchemaMigrationRunner(jdbcTemplate).run();

        verify(metaData).getColumns(isNull(), isNull(), eq("mailbox"), eq("stego_packet"));
    }

    @Test
    void run_ShouldCopyAndDropOldColumn_WhenBothColumnsExist() throws Exception {
        mockColumns(true, true);
        when(jdbcTemplate.update("UPDATE mailbox SET payload = stego_packet WHERE payload IS NULL"))
                .thenReturn(3);

        new SchemaMigrationRunner(jdbcTemplate).run();

        verify(jdbcTemplate).update("UPDATE mailbox SET payload = stego_packet WHERE payload IS NULL");
        verify(jdbcTemplate).execute("ALTER TABLE mailbox DROP COLUMN stego_packet");
    }

    @Test
    void run_ShouldRenameOldColumn_WhenPayloadColumnMissing() throws Exception {
        mockColumns(true, false);

        new SchemaMigrationRunner(jdbcTemplate).run();

        verify(jdbcTemplate).execute("ALTER TABLE mailbox RENAME COLUMN stego_packet TO payload");
    }

    @Test
    void run_ShouldSwallowMigrationErrors() {
        when(jdbcTemplate.getDataSource()).thenThrow(new IllegalStateException("metadata unavailable"));

        new SchemaMigrationRunner(jdbcTemplate).run();
    }

    private void mockColumns(boolean oldColumnExists, boolean payloadColumnExists) throws Exception {
        when(jdbcTemplate.getDataSource()).thenReturn(dataSource);
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.getMetaData()).thenReturn(metaData);

        ResultSet oldLower = resultSet(oldColumnExists);
        ResultSet oldUpper = resultSet(false);
        ResultSet payloadLower = resultSet(payloadColumnExists);
        ResultSet payloadUpper = resultSet(false);

        lenient().when(metaData.getColumns(isNull(), isNull(), eq("mailbox"), eq("stego_packet")))
                .thenReturn(oldLower);
        lenient().when(metaData.getColumns(isNull(), isNull(), eq("MAILBOX"), eq("STEGO_PACKET")))
                .thenReturn(oldUpper);
        lenient().when(metaData.getColumns(isNull(), isNull(), eq("mailbox"), eq("payload")))
                .thenReturn(payloadLower);
        lenient().when(metaData.getColumns(isNull(), isNull(), eq("MAILBOX"), eq("PAYLOAD")))
                .thenReturn(payloadUpper);
    }

    private ResultSet resultSet(boolean exists) throws Exception {
        ResultSet resultSet = org.mockito.Mockito.mock(ResultSet.class);
        lenient().when(resultSet.next()).thenReturn(exists);
        return resultSet;
    }
}
