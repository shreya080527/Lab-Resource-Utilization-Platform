package com.example.lab_resource_platform.controller;


import com.example.lab_resource_platform.dto.WaitlistResponse;
import com.example.lab_resource_platform.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/waitlist")
@RequiredArgsConstructor
public class WaitlistController {
    private final BookingService bookingService;

    @GetMapping
    @PreAuthorize("hasAnyRole('LAB_MANAGER','SYSTEM_ADMIN')")
    public ResponseEntity<List<WaitlistResponse>> all() {
        return ResponseEntity.ok(bookingService.findAllWaitlist()
                .stream().map(WaitlistResponse::from).toList());
    }

    @GetMapping("/equipment/{equipmentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<WaitlistResponse>> byEquipment(@PathVariable Long equipmentId) {
        return ResponseEntity.ok(bookingService.findWaitlistForEquipment(equipmentId)
                .stream().map(WaitlistResponse::from).toList());
    }

    @PostMapping("/equipment/{equipmentId}/promote")
    @PreAuthorize("hasAnyRole('LAB_MANAGER','SYSTEM_ADMIN')")
    public ResponseEntity<Map<String, Object>> promote(
            @PathVariable Long equipmentId,
            @RequestBody(required = false) Map<String, Long> body) {
        Long waitlistId = (body != null) ? body.get("waitlistId") : null;
        boolean promoted = bookingService.manualPromote(equipmentId, waitlistId);
        return ResponseEntity.ok(Map.of(
                "promoted", promoted,
                "message", promoted ? "Waitlist entry promoted to PENDING booking"
                        : "No eligible waitlist entries found"
        ));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('RESEARCHER','LAB_MANAGER')")
    public ResponseEntity<Map<String, String>> remove(@PathVariable Long id) {
        bookingService.removeWaitlistEntry(id);
        return ResponseEntity.ok(Map.of("message", "Removed from waitlist successfully"));
    }
}
