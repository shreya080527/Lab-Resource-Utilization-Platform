package com.example.lab_resource_platform.controller;


import com.example.lab_resource_platform.dto.InstitutionRequest;
import com.example.lab_resource_platform.dto.InstitutionResponse;
import com.example.lab_resource_platform.service.InstitutionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/institutions")
@RequiredArgsConstructor
public class InstitutionController {
    private final InstitutionService institutionService;

    @PostMapping
    @PreAuthorize("hasAnyRole('LAB_MANAGER','SYSTEM_ADMIN', 'INSTITUTION_ADMIN')")
    public ResponseEntity<InstitutionResponse> create(@Valid @RequestBody InstitutionRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(institutionService.create(req));
    }

    @GetMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<List<InstitutionResponse>> findAll() {
        return ResponseEntity.ok(institutionService.findAll());
    }
}
