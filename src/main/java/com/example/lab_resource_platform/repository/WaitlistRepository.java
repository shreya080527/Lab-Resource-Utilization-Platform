package com.example.lab_resource_platform.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.lab_resource_platform.entity.Waitlist;

public interface WaitlistRepository extends JpaRepository<Waitlist, Long> {
    List<Waitlist> findByEquipmentIdOrderByCreatedAtAsc(Long equipmentId);
    List<Waitlist> findByUserIdOrderByCreatedAtAsc(Long userId);
}