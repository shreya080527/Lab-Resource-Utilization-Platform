package com.example.lab_resource_platform.controller.equipment;

import com.example.lab_resource_platform.dto.equipment.*;
import com.example.lab_resource_platform.entity.equipment.EquipmentStatus;
import com.example.lab_resource_platform.service.EquipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/equipment")
@RequiredArgsConstructor
public class EquipmentController {
    private final EquipmentService equipmentService;

    @PostMapping("/add-equipment")
    @PreAuthorize("hasAnyRole('LAB_MANAGER','SYSTEM_ADMIN','DEPARTMENT_HEAD','INSTITUTION_ADMIN','LAB_TECHNICIAN')")
    public ResponseEntity<EquipmentResponse> create(@Valid @RequestBody CreateEquipmentRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(equipmentService.create(req));
    }

    @GetMapping("/get-equipment/{id}")
    @PreAuthorize("hasAnyRole('LAB_MANAGER','SYSTEM_ADMIN','RESEARCHER','DEPARTMENT_HEAD','INSTITUTION_ADMIN','LAB_TECHNICIAN')")
    public ResponseEntity<EquipmentResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(equipmentService.getById(id));
    }

    @PutMapping("/update-equipment/{id}")
    @PreAuthorize("hasAnyRole('LAB_MANAGER','SYSTEM_ADMIN','DEPARTMENT_HEAD','INSTITUTION_ADMIN','LAB_TECHNICIAN')")
    public ResponseEntity<EquipmentResponse> update(@PathVariable Long id,
                                                    @Valid @RequestBody UpdateEquipmentRequest req) {
        return ResponseEntity.ok(equipmentService.update(id, req));
    }

    @DeleteMapping("/delete-equipment/{id}")
    @PreAuthorize("hasAnyRole('LAB_MANAGER','SYSTEM_ADMIN','DEPARTMENT_HEAD','INSTITUTION_ADMIN','LAB_TECHNICIAN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        equipmentService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/get-all-equipments")
    @PreAuthorize("hasAnyRole('LAB_MANAGER','SYSTEM_ADMIN','RESEARCHER','DEPARTMENT_HEAD','INSTITUTION_ADMIN','LAB_TECHNICIAN')")
    public ResponseEntity<List<EquipmentResponse>> getAll() {
        return ResponseEntity.ok(equipmentService.getAll());
    }

    @GetMapping("/get-my-equipments")
    @PreAuthorize("hasAnyRole('LAB_MANAGER','SYSTEM_ADMIN','DEPARTMENT_HEAD','INSTITUTION_ADMIN','LAB_TECHNICIAN')")
    public ResponseEntity<List<EquipmentResponse>> getMyEquipments() {
        return ResponseEntity.ok(equipmentService.getMyEquipments());
    }

    @PutMapping("/update-equipment-status/{id}")
    @PreAuthorize("hasAnyRole('LAB_MANAGER','SYSTEM_ADMIN','DEPARTMENT_HEAD','INSTITUTION_ADMIN','LAB_TECHNICIAN')")
    public ResponseEntity<EquipmentResponse> updateStatus(@PathVariable Long id,
                                                          @RequestBody UpdateEquipmentStatusRequest req) {
        return ResponseEntity.ok(equipmentService.updateStatus(id, req.getStatus()));
    }

    @GetMapping("/filter")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<EquipmentResponse>> filter(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long institutionId,
            @RequestParam(required = false) EquipmentStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        EquipmentFilterRequest filter = new EquipmentFilterRequest();
        filter.setCategory(category);
        filter.setTag(tag);
        filter.setDepartmentId(departmentId);
        filter.setInstitutionId(institutionId);
        filter.setStatus(status);
        filter.setSearch(search);
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(equipmentService.filter(filter, pageable));
    }
}