package com.hermnet.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hermnet.api.model.RateLimitBucket;

@Repository
public interface RateLimitBucketRepository extends JpaRepository<RateLimitBucket, String> {
    
}
