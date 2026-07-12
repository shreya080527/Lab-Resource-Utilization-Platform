package com.example.lab_resource_platform.dto;

import com.example.lab_resource_platform.entity.BookingAudit;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor
public class BookingAuditResponse {
    private Long id;
    private Long bookingId;
    private String action;
    private String fromStatus;
    private String toStatus;
    private String performedByUsername;
    private String notes;
    private LocalDateTime createdAt;

    public static BookingAuditResponse from(BookingAudit a) {
        return BookingAuditResponse.builder()
                .id(a.getId())
                .bookingId(a.getBooking().getId())
                .action(a.getAction())
                .fromStatus(a.getFromStatus())
                .toStatus(a.getToStatus())
                .performedByUsername(a.getPerformedBy() != null ? a.getPerformedBy().getUsername() : "SYSTEM")
                .notes(a.getNotes())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
