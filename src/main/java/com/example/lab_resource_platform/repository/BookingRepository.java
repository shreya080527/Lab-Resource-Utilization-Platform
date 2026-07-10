package com.example.lab_resource_platform.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.lab_resource_platform.entity.Bookings.Booking;
import com.example.lab_resource_platform.entity.Bookings.BookingStatus;

import jakarta.persistence.LockModeType;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    // 1. Existing check for general time slot overlaps
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT COUNT(b) > 0 FROM Booking b WHERE b.equipment.id = :equipmentId " +
           "AND b.status IN (:statuses) " +
           "AND b.startTime < :endTime AND b.endTime > :startTime")
    boolean existsOverlappingActiveBookingsForUpdate(@Param("equipmentId") Long equipmentId,
                                                     @Param("startTime") LocalDateTime startTime,
                                                     @Param("endTime") LocalDateTime endTime,
                                                     @Param("statuses") List<BookingStatus> statuses);

    // 2. NEW CHECK: Verifies if this specific user already has a pending or confirmed booking for this item
    @Query("SELECT COUNT(b) > 0 FROM Booking b WHERE b.equipment.id = :equipmentId " +
           "AND b.user.id = :userId " +
           "AND b.status IN (:statuses)")
    boolean existsByEquipmentIdAndUserIdAndStatusIn(@Param("equipmentId") Long equipmentId,
                                                    @Param("userId") Long userId,
                                                    @Param("statuses") List<BookingStatus> statuses);

    @Query("SELECT b FROM Booking b WHERE b.user.id = :userId " +
           "AND b.startTime >= :start AND b.endTime <= :end")
    List<Booking> findBookingsInCalendarRange(@Param("userId") Long userId,
                                             @Param("start") LocalDateTime start,
                                             @Param("end") LocalDateTime end);
    
    @Query("SELECT b FROM Booking b WHERE b.equipment.id = :equipmentId " +
    	       "AND b.status IN :statuses " +
    	       "AND b.startTime < :periodEnd " +
    	       "AND b.endTime > :periodStart")
    List<Booking> findBookingsForUtilization(
            @Param("equipmentId") Long equipmentId,
            @Param("periodStart") LocalDateTime periodStart,
            @Param("periodEnd") LocalDateTime periodEnd,
            @Param("statuses") List<BookingStatus> statuses);
    
    List<Booking> findByUserIdOrderByStartTimeAsc(Long userId);


    
}