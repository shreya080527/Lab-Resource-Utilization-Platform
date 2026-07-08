package com.example.lab_resource_platform.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.lab_resource_platform.dto.BookingDto;
import com.example.lab_resource_platform.dto.ResearcherDashboardDto;
import com.example.lab_resource_platform.entity.Bookings.Booking;
import com.example.lab_resource_platform.entity.Bookings.BookingStatus;
import com.example.lab_resource_platform.service.BookingService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('RESEARCHER')")
    public ResponseEntity<?> createBooking(@RequestBody BookingDto request) {
        try {
            String response = bookingService.createBooking(
                    request.getUserId(),
                    request.getEquipmentId(),
                    request.getStartTime(),
                    request.getEndTime()
            );
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException ex) {
            // Returns the precise 400 Bad Request Map structure when validation rules fail
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Bad Request",
                "message", ex.getMessage()
            ));
        } catch (Exception ex) {
            // General catch-all block to prevent server stacktrace leaks
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Internal Server Error",
                "message", ex.getMessage()
            ));
        }
    }

    @GetMapping("/calendar")
    @PreAuthorize("hasAnyRole('RESEARCHER')")
    public ResponseEntity<List<Booking>> getCalendar(
            @RequestParam Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(bookingService.getCalendar(userId, start, end));
    }

    @PostMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('RESEARCHER', 'LAB_MANAGER')")
    public ResponseEntity<String> updateStatus(@PathVariable Long id, @RequestParam BookingStatus status) {
        bookingService.updateBookingStatus(id, status);
        return ResponseEntity.ok("Booking status updated to " + status + ". Waitlist verified.");
    }
    
    @GetMapping("/my-dashboard/{userId}")
    @PreAuthorize("hasAnyRole('RESEARCHER')")
    public ResponseEntity<?> getResearcherDashboard(@PathVariable Long userId) {
        try {
            ResearcherDashboardDto dashboardData = bookingService.getResearcherDashboard(userId);
            return ResponseEntity.ok(dashboardData);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Bad Request",
                "message", ex.getMessage()
            ));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Internal Server Error",
                "message", ex.getMessage()
            ));
        }
    }
}