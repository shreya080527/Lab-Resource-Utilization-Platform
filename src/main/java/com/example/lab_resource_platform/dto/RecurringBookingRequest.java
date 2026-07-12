package com.example.lab_resource_platform.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class RecurringBookingRequest {
    @NotNull private Long userId;
    @NotNull private Long equipmentId;
    @NotNull private LocalDateTime startTime;
    @NotNull private LocalDateTime endTime;
    @NotBlank(message = "Recurrence pattern is required")
    @Pattern(regexp = "DAILY|WEEKLY|MONTHLY", message = "Must be DAILY, WEEKLY, or MONTHLY")
    private String recurrencePattern;
    @Min(value = 1, message = "Recurrence count must be at least 1")
    @Max(value = 52, message = "Recurrence count cannot exceed 52")
    private int recurrenceCount;
}