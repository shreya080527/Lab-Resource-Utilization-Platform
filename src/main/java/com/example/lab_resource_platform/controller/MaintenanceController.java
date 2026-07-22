package com.example.lab_resource_platform.controller;

import com.example.lab_resource_platform.dto.CompleteMaintenanceRequest;
import com.example.lab_resource_platform.dto.CreateMaintenanceRequestRequest;
import com.example.lab_resource_platform.dto.MaintenanceRequestDto;
import com.example.lab_resource_platform.service.MaintenanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

/**
 * Maintenance Request endpoints.
 *
 * Authorization:
 *   - create / cancel / findAll / findMyRequested → LAB_MANAGER (+ SYSTEM_ADMIN)
 *   - start / complete / findMyAssigned           → LAB_TECHNICIAN
 *   - findByEquipment / getById                   → any authenticated user
 */
@RestController
@RequestMapping("/api/maintenance")
@RequiredArgsConstructor
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    // ═══════════════════════════════════════════════════════════════
    // CREATE
    // ═══════════════════════════════════════════════════════════════

    @PostMapping
    @PreAuthorize("hasAnyRole('LAB_MANAGER','SYSTEM_ADMIN')")
    public ResponseEntity<MaintenanceRequestDto> create(@Valid @RequestBody CreateMaintenanceRequestRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(maintenanceService.create(req));
    }

    // ═══════════════════════════════════════════════════════════════
    // LIFECYCLE
    // ═══════════════════════════════════════════════════════════════

    @PutMapping("/{id}/start")
    @PreAuthorize("hasRole('LAB_TECHNICIAN')")
    public ResponseEntity<MaintenanceRequestDto> start(@PathVariable Long id) {
        return ResponseEntity.ok(maintenanceService.start(id));
    }

    @PutMapping("/{id}/complete")
    @PreAuthorize("hasRole('LAB_TECHNICIAN')")
    public ResponseEntity<MaintenanceRequestDto> complete(@PathVariable Long id,
                                                          @Valid @RequestBody CompleteMaintenanceRequest body) {
        return ResponseEntity.ok(maintenanceService.complete(id, body));
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('LAB_MANAGER','SYSTEM_ADMIN')")
    public ResponseEntity<MaintenanceRequestDto> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(maintenanceService.cancel(id));
    }

    // ═══════════════════════════════════════════════════════════════
    // QUERIES
    // ═══════════════════════════════════════════════════════════════

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MaintenanceRequestDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(maintenanceService.getById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('LAB_MANAGER','SYSTEM_ADMIN')")
    public ResponseEntity<List<MaintenanceRequestDto>> findAll() {
        return ResponseEntity.ok(maintenanceService.findAll());
    }

    @GetMapping("/my-assigned")
    @PreAuthorize("hasRole('LAB_TECHNICIAN')")
    public ResponseEntity<List<MaintenanceRequestDto>> findMyAssigned() {
        return ResponseEntity.ok(maintenanceService.findMyAssigned());
    }

    @GetMapping("/my-requested")
    @PreAuthorize("hasAnyRole('LAB_MANAGER','SYSTEM_ADMIN')")
    public ResponseEntity<List<MaintenanceRequestDto>> findMyRequested() {
        return ResponseEntity.ok(maintenanceService.findMyRequested());
    }

    @GetMapping("/equipment/{equipmentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MaintenanceRequestDto>> findByEquipment(@PathVariable Long equipmentId) {
        return ResponseEntity.ok(maintenanceService.findByEquipment(equipmentId));
    }

    @GetMapping("/my-active-count")
    @PreAuthorize("hasRole('LAB_TECHNICIAN')")
    public ResponseEntity<Long> countMyActiveAssigned() {
        return ResponseEntity.ok(maintenanceService.countMyActiveAssigned());
    }
}
