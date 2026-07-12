package com.example.lab_resource_platform.controller;


import com.example.lab_resource_platform.entity.Bookings.BookingStatus;
import com.example.lab_resource_platform.entity.equipment.EquipmentStatus;
import com.example.lab_resource_platform.repository.BookingRepository;
import com.example.lab_resource_platform.repository.CalibrationRecordRepo;
import com.example.lab_resource_platform.repository.WaitlistRepository;
import com.example.lab_resource_platform.repository.equipment.EquipmentRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {
    private final EquipmentRepo equipmentRepo;
    private final BookingRepository bookingRepo;
    private final WaitlistRepository waitlistRepo;
    private final CalibrationRecordRepo calibrationRepo;

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('LAB_MANAGER','SYSTEM_ADMIN','INSTITUTION_ADMIN','DEPARTMENT_HEAD')")
    public ResponseEntity<Map<String, Object>> stats() {
        LocalDate now = LocalDate.now();
        LocalDate in30 = now.plusDays(30);

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalEquipment", equipmentRepo.count());
        stats.put("availableCount", equipmentRepo.countByStatus(EquipmentStatus.AVAILABLE));
        stats.put("bookedCount", equipmentRepo.countByStatus(EquipmentStatus.BOOKED));
        stats.put("maintenanceCount", equipmentRepo.countByStatus(EquipmentStatus.UNDER_MAINTENANCE));
        stats.put("outOfServiceCount", equipmentRepo.countByStatus(EquipmentStatus.OUT_OF_SERVICE));
        stats.put("retiredCount", equipmentRepo.countByStatus(EquipmentStatus.RETIRED));
        stats.put("pendingApprovalCount", bookingRepo.findByStatus(BookingStatus.PENDING).size());
        stats.put("activeBookingsCount", bookingRepo.findByStatus(BookingStatus.IN_PROGRESS).size());
        stats.put("waitlistCount", waitlistRepo.count());
        stats.put("calibrationsDueIn30Days", calibrationRepo.countDueBetween(now, in30));
        stats.put("generatedAt", LocalDateTime.now());
        return ResponseEntity.ok(stats);
    }
}
