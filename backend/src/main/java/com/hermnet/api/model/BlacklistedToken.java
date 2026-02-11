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

     @Column(nullable = false)
     private LocalDateTime expiresAt;

     @Column(nullable = false)
     private LocalDateTime blacklistedAt;

     @PrePersist
     public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
     }
}
