package com.example.lab_resource_platform.controller;

import com.example.lab_resource_platform.dto.DepartmentRequest;
import com.example.lab_resource_platform.dto.DepartmentResponse;
import com.example.lab_resource_platform.service.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
public class DepartmentController {
    private final DepartmentService departmentService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INSTITUTION_ADMIN')")
    public ResponseEntity<DepartmentResponse> create(@Valid @RequestBody DepartmentRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(departmentService.create(req));
    }

    @GetMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<List<DepartmentResponse>> findAll(
            @RequestParam(required = false) Long institutionId) {
        return ResponseEntity.ok(departmentService.findAll(institutionId));
    }
}
