package com.example.lab_resource_platform.controller;

import com.example.lab_resource_platform.dto.TagRequest;
import com.example.lab_resource_platform.dto.TagResponse;
import com.example.lab_resource_platform.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/equipment")
@RequiredArgsConstructor
public class TagController {
    private final TagService tagService;

    @PostMapping("/{equipmentId}/tags")
    @PreAuthorize("hasAnyRole('LAB_MANAGER','SYSTEM_ADMIN','LAB_TECHNICIAN')")
    public ResponseEntity<List<TagResponse>> addTags(
            @PathVariable Long equipmentId,
            @Valid @RequestBody TagRequest req) {
        return ResponseEntity.ok(tagService.addTags(equipmentId, req));
    }

    @DeleteMapping("/{equipmentId}/tags/{tagId}")
    @PreAuthorize("hasAnyRole('LAB_MANAGER','SYSTEM_ADMIN')")
    public ResponseEntity<Map<String, String>> removeTag(
            @PathVariable Long equipmentId,
            @PathVariable Long tagId) {
        tagService.removeTag(equipmentId, tagId);
        return ResponseEntity.ok(Map.of("message", "Tag removed successfully"));
    }

    @GetMapping("/tags")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<TagResponse>> listAll() {
        return ResponseEntity.ok(tagService.findAll());
    }
}