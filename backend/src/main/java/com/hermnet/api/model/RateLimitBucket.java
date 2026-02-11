package com.hermnet.api.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "rate_limit_buckets")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RateLimitBucket {
    
    @Id
    @Column(name = "ip_hash", length = 64)
    private String ipHash;

    @Column(name = "request_count", nullable = false)
    @Builder.Default
    private int requestCount = 0;

    @Column(name = "reset_time", nullable = false)
    private LocalDateTime resetTime;

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(resetTime);
    }
}
