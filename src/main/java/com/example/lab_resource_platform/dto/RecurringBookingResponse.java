package com.example.lab_resource_platform.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @AllArgsConstructor
public class RecurringBookingResponse {
    private Long parentBookingId;
    private int totalBookingsCreated;
    private int totalWaitlisted;
    private List<BookingResponse> bookings;
    private List<WaitlistSlot> waitlistedSlots;

    @Data @AllArgsConstructor
    public static class WaitlistSlot {
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private String message;
    }
}