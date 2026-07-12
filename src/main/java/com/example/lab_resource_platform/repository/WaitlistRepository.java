package com.example.lab_resource_platform.repository;

import com.example.lab_resource_platform.entity.Waitlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WaitlistRepository extends JpaRepository<Waitlist, Long> {
    List<Waitlist> findByEquipmentIdOrderByPositionAsc(Long equipmentId);
    List<Waitlist> findAllByOrderByCreatedAtAsc();

    @Query("SELECT MAX(w.position) FROM Waitlist w WHERE w.equipment.id = :equipmentId")
    Integer findMaxPositionForEquipment(@Param("equipmentId") Long equipmentId);

    @Query("SELECT w FROM Waitlist w WHERE w.user.id = :userId ORDER BY w.createdAt DESC")
    List<Waitlist> findByUserId(@Param("userId") Long userId);

    Optional<Waitlist> findByUserIdAndEquipmentId(Long userId, Long equipmentId);
}