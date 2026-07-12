package com.example.lab_resource_platform.controller;

import com.example.lab_resource_platform.dto.EquipmentUtilizationDTO;
import com.example.lab_resource_platform.service.BookingService;
import com.example.lab_resource_platform.service.UtilizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings/utilization")
@RequiredArgsConstructor
public class UtilizationController {
    private final BookingService bookingService;
    private final UtilizationService utilizationService;

    @GetMapping
    @PreAuthorize("hasRole('LAB_MANAGER')")
    public ResponseEntity<EquipmentUtilizationDTO> single(
            @RequestParam Long equipmentId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(bookingService.calculateUtilization(equipmentId, start, end));
    }

    @GetMapping("/realtime")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> realtime() {
        return ResponseEntity.ok(utilizationService.realtime());
    }

    @GetMapping("/department")
    @PreAuthorize("hasAnyRole('LAB_MANAGER','DEPARTMENT_HEAD','INSTITUTION_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<Map<String, Object>> department(
            @RequestParam Long departmentId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(utilizationService.departmentUtilization(departmentId, start, end));
    }

    @GetMapping("/institution")
    @PreAuthorize("hasAnyRole('INSTITUTION_ADMIN','SYSTEM_ADMIN')")
    public ResponseEntity<Map<String, Object>> institution(
            @RequestParam Long institutionId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(utilizationService.institutionUtilization(institutionId, start, end));
    }

    @GetMapping("/heatmap")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> heatmap(
            @RequestParam Long equipmentId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(utilizationService.heatmap(equipmentId, start, end));
    }

    @GetMapping("/idle")
    @PreAuthorize("hasAnyRole('LAB_MANAGER','SYSTEM_ADMIN')")
    public ResponseEntity<Map<String, Object>> idle(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestParam(defaultValue = "500") double thresholdHours) {
        return ResponseEntity.ok(utilizationService.idleReport(start, end, thresholdHours));
    }

    @GetMapping("/peak")
    @PreAuthorize("hasAnyRole('LAB_MANAGER','SYSTEM_ADMIN')")
    public ResponseEntity<Map<String, Object>> peak(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(utilizationService.peakAnalysis(start, end));
    }

    @GetMapping("/benchmark")
    @PreAuthorize("hasAnyRole('LAB_MANAGER','SYSTEM_ADMIN')")
    public ResponseEntity<Map<String, Object>> benchmark(
            @RequestParam Long equipmentId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(utilizationService.benchmark(equipmentId, start, end));
    }

    @GetMapping("/shared-vs-exclusive")
    @PreAuthorize("hasAnyRole('LAB_MANAGER','SYSTEM_ADMIN')")
    public ResponseEntity<Map<String, Object>> sharedVsExclusive(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(utilizationService.sharedVsExclusive(start, end));
    }
}