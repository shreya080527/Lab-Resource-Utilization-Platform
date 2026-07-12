package com.example.lab_resource_platform.repository;

import com.example.lab_resource_platform.entity.Bookings.Booking;
import com.example.lab_resource_platform.entity.Bookings.BookingStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT COUNT(b) > 0 FROM Booking b WHERE b.equipment.id = :equipmentId " +
            "AND b.status IN :statuses AND b.startTime < :endTime AND b.endTime > :startTime")
    boolean existsOverlappingActiveBookingsForUpdate(@Param("equipmentId") Long equipmentId,
                                                     @Param("startTime") LocalDateTime startTime,
                                                     @Param("endTime") LocalDateTime endTime,
                                                     @Param("statuses") List<BookingStatus> statuses);

    @Query("SELECT COUNT(b) > 0 FROM Booking b WHERE b.equipment.id = :equipmentId " +
            "AND b.user.id = :userId AND b.status IN :statuses")
    boolean existsByEquipmentIdAndUserIdAndStatusIn(@Param("equipmentId") Long equipmentId,
                                                    @Param("userId") Long userId,
                                                    @Param("statuses") List<BookingStatus> statuses);

    @Query("SELECT b FROM Booking b WHERE b.user.id = :userId " +
            "AND b.startTime >= :start AND b.endTime <= :end")
    List<Booking> findBookingsInCalendarRange(@Param("userId") Long userId,
                                              @Param("start") LocalDateTime start,
                                              @Param("end") LocalDateTime end);

    @Query("SELECT b FROM Booking b WHERE b.equipment.id = :equipmentId " +
            "AND b.status NOT IN ('CANCELLED','REJECTED') " +
            "AND b.startTime < :end AND b.endTime > :start " +
            "ORDER BY b.startTime ASC")
    List<Booking> findEquipmentCalendar(@Param("equipmentId") Long equipmentId,
                                        @Param("start") LocalDateTime start,
                                        @Param("end") LocalDateTime end);

    @Query("SELECT b FROM Booking b WHERE b.equipment.id = :equipmentId " +
            "AND b.status IN :statuses AND b.startTime < :periodEnd AND b.endTime > :periodStart")
    List<Booking> findBookingsForUtilization(@Param("equipmentId") Long equipmentId,
                                             @Param("periodStart") LocalDateTime periodStart,
                                             @Param("periodEnd") LocalDateTime periodEnd,
                                             @Param("statuses") List<BookingStatus> statuses);

    List<Booking> findByUserIdOrderByStartTimeAsc(Long userId);

    List<Booking> findByStatus(BookingStatus status);

    @Query("SELECT b FROM Booking b WHERE b.parentBooking.id = :parentId")
    List<Booking> findByParentBookingId(@Param("parentId") Long parentId);
}

