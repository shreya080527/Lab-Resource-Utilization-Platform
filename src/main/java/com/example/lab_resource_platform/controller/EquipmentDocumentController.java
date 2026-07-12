package com.example.lab_resource_platform.controller;

import com.example.lab_resource_platform.dto.DocumentRequest;
import com.example.lab_resource_platform.dto.DocumentResponse;
import com.example.lab_resource_platform.service.EquipmentDocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/equipment/{equipmentId}/documents")
@RequiredArgsConstructor
public class EquipmentDocumentController {
    private final EquipmentDocumentService documentService;

    @PostMapping
    @PreAuthorize("hasAnyRole('LAB_MANAGER','SYSTEM_ADMIN','LAB_TECHNICIAN')")
    public ResponseEntity<DocumentResponse> create(
            @PathVariable Long equipmentId,
            @Valid @RequestBody DocumentRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(documentService.create(equipmentId, req));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<DocumentResponse>> list(@PathVariable Long equipmentId) {
        return ResponseEntity.ok(documentService.findByEquipment(equipmentId));
    }

    @DeleteMapping("/{documentId}")
    @PreAuthorize("hasAnyRole('LAB_MANAGER','SYSTEM_ADMIN')")
    public ResponseEntity<Map<String, String>> delete(
            @PathVariable Long equipmentId,
            @PathVariable Long documentId) {
        documentService.delete(documentId);
        return ResponseEntity.ok(Map.of("message", "Document deleted successfully"));
    }
}