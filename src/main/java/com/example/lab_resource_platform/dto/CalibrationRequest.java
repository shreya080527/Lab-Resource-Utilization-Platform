package com.example.lab_resource_platform.dto;

import com.example.lab_resource_platform.entity.CalibrationRecord;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CalibrationRequest {
    @NotNull(message = "Record type is required")
    private CalibrationRecord.RecordType recordType;

    @NotNull(message = "Performed date is required")
    private LocalDate performedDate;

    private LocalDate nextDueDate;
    private String performedBy;
    private String result;
    private String certificateRef;
    private String notes;
}