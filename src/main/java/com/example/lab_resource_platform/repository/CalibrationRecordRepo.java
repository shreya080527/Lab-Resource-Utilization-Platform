package com.example.lab_resource_platform.repository;

import com.example.lab_resource_platform.entity.CalibrationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CalibrationRecordRepo extends JpaRepository<CalibrationRecord, Long> {
    List<CalibrationRecord> findByEquipmentIdOrderByPerformedDateDesc(Long equipmentId);

    @Query("SELECT c FROM CalibrationRecord c WHERE c.equipment.id = :equipmentId " +
            "AND c.nextDueDate BETWEEN :from AND :to ORDER BY c.nextDueDate ASC")
    List<CalibrationRecord> findDueForEquipment(@Param("equipmentId") Long equipmentId,
                                                @Param("from") LocalDate from,
                                                @Param("to") LocalDate to);

    @Query("SELECT c FROM CalibrationRecord c WHERE c.nextDueDate BETWEEN :from AND :to ORDER BY c.nextDueDate ASC")
    List<CalibrationRecord> findDueBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT COUNT(c) FROM CalibrationRecord c WHERE c.nextDueDate BETWEEN :from AND :to")
    long countDueBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);
}