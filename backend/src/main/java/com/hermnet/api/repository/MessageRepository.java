package com.hermnet.api.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hermnet.api.model.Message;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findeByRecipientIdOrderByCreatedAtDesc(String recipientId);
}
