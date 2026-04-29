package com.hermnet.api.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * One-shot schema migrations that Hibernate's {@code ddl-auto=update} cannot perform
 * on its own (renames in particular). Each step is idempotent — repeated runs are no-ops
 * once the migration has already been applied.
 *
 * Current migrations:
 *  - mailbox.stego_packet → mailbox.payload (the column was renamed when the
 *    steganography layer was removed in favour of pure hybrid encryption).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SchemaMigrationRunner {

    private final JdbcTemplate jdbcTemplate;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void run() {
        renameStegoPacketToPayload();
    }

    /**
     * After the steganography layer was removed, the payload column was renamed.
     * Hibernate ddl-auto=update will create the new {@code payload} column but
     * leaves the old {@code stego_packet} column behind (orphan).
     *
     * If both columns exist in the table, we copy data over to the new column
     * (where it isn't already populated) and drop the old one. This preserves
     * any messages stored in older deployments.
     */
    private void renameStegoPacketToPayload() {
        try {
            Boolean hasOldColumn = jdbcTemplate.queryForObject(
                    "SELECT EXISTS (SELECT 1 FROM information_schema.columns " +
                            "WHERE table_name = 'mailbox' AND column_name = 'stego_packet')",
                    Boolean.class
            );
            if (Boolean.FALSE.equals(hasOldColumn)) {
                return; // already migrated or fresh DB
            }

            Boolean hasNewColumn = jdbcTemplate.queryForObject(
                    "SELECT EXISTS (SELECT 1 FROM information_schema.columns " +
                            "WHERE table_name = 'mailbox' AND column_name = 'payload')",
                    Boolean.class
            );

            if (Boolean.TRUE.equals(hasNewColumn)) {
                int copied = jdbcTemplate.update(
                        "UPDATE mailbox SET payload = stego_packet WHERE payload IS NULL"
                );
                log.info("Migrated {} mailbox rows from stego_packet to payload", copied);
                jdbcTemplate.execute("ALTER TABLE mailbox DROP COLUMN stego_packet");
            } else {
                jdbcTemplate.execute("ALTER TABLE mailbox RENAME COLUMN stego_packet TO payload");
                log.info("Renamed mailbox.stego_packet -> mailbox.payload");
            }
        } catch (Exception e) {
            log.warn("Schema migration (stego_packet -> payload) skipped: {}", e.getMessage());
        }
    }
}
