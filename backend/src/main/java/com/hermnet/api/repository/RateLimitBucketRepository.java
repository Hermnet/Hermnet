package com.hermnet.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hermnet.api.model.RateLimitBucket;

/**
 * Repository interface for managing rate limiting buckets.
 * 
 * Used to track request counts per IP address hash. Standard CRUD operations
 * (findById, save) are sufficient for basic rate limiting logic.
 */
@Repository
public interface RateLimitBucketRepository extends JpaRepository<RateLimitBucket, String> {

}
