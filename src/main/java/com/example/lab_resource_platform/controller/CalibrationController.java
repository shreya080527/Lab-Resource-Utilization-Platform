package com.example.lab_resource_platform.controller;

import com.example.lab_resource_platform.dto.CalibrationRequest;
import com.example.lab_resource_platform.dto.CalibrationResponse;
import com.example.lab_resource_platform.service.CalibrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/equipment/{equipmentId}/calibrations")
@RequiredArgsConstructor
public class CalibrationController {
    private final CalibrationService calibrationService;

    @PostMapping
    @PreAuthorize("hasAnyRole('LAB_MANAGER','SYSTEM_ADMIN', 'LAB_TECHNICIAN')")
    public ResponseEntity<CalibrationResponse> create(
            @PathVariable Long equipmentId,
            @Valid @RequestBody CalibrationRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(calibrationService.create(equipmentId, req));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CalibrationResponse>> list(@PathVariable Long equipmentId) {
        return ResponseEntity.ok(calibrationService.findByEquipment(equipmentId));
    }

    @GetMapping("/due")
    @PreAuthorize("hasAnyRole('LAB_MANAGER','SYSTEM_ADMIN','LAB_TECHNICIAN')")
    public ResponseEntity<List<CalibrationResponse>> due(
            @PathVariable Long equipmentId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(calibrationService.findDueForEquipment(equipmentId, from, to));
    }
}
