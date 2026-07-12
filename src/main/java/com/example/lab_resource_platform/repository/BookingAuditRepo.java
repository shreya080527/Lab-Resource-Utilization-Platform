package com.example.lab_resource_platform.repository;

import com.example.lab_resource_platform.entity.BookingAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingAuditRepo extends JpaRepository<BookingAudit, Long> {
    List<BookingAudit> findByBookingIdOrderByCreatedAtAsc(Long bookingId);

    @Query("SELECT a FROM BookingAudit a WHERE a.booking.equipment.id = :equipmentId ORDER BY a.createdAt DESC")
    List<BookingAudit> findByEquipmentId(@Param("equipmentId") Long equipmentId);
}