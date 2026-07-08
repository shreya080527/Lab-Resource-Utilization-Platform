package com.example.lab_resource_platform.dto;

import java.time.LocalDateTime;

import com.example.lab_resource_platform.entity.Bookings.BookingStatus;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserBookingResponsedto {
    private Long bookingId;
    private Long equipmentId;
    private String equipmentName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private BookingStatus status;
}
