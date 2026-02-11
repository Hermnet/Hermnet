package com.hermnet.api.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "token_blacklist")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BlacklistedToken {
    
     @Id
     private String tokenHash;

     @Column(name = "expires_at", nullable = false)
     private LocalDateTime expiresAt;

     @Column(name = "blacklisted_at", nullable = false)
     private LocalDateTime blacklistedAt;

     @PrePersist
     public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
     }
}
