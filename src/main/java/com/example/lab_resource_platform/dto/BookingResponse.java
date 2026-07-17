package com.example.lab_resource_platform.dto;



import com.example.lab_resource_platform.entity.Bookings.Booking;
import com.example.lab_resource_platform.entity.Bookings.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor
public class BookingResponse {
    private Long id;
    private Long equipmentId;
    private String equipmentName;
    private Long userId;
    private String username;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private BookingStatus status;
    private String recurrencePattern;
    private Long parentBookingId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Department info for frontend permission checks
    private Long equipmentDepartmentId;
    private String equipmentDepartmentName;

    public static BookingResponse from(Booking b) {
        return BookingResponse.builder()
                .id(b.getId())
                .equipmentId(b.getEquipment().getId())
                .equipmentName(b.getEquipment().getEquipmentName())
                .userId(b.getUser().getId())
                .username(b.getUser().getUsername())
                .startTime(b.getStartTime())
                .endTime(b.getEndTime())
                .status(b.getStatus())
                .recurrencePattern(b.getRecurrencePattern())
                .parentBookingId(b.getParentBooking() != null ? b.getParentBooking().getId() : null)
                .createdAt(b.getCreatedAt())
                .updatedAt(b.getUpdatedAt())
                .equipmentDepartmentId(b.getEquipment().getDepartment() != null ? b.getEquipment().getDepartment().getId() : null)
                .equipmentDepartmentName(b.getEquipment().getDepartment() != null ? b.getEquipment().getDepartment().getName() : null)
                .build();
    }
}