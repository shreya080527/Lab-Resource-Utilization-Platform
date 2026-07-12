package com.example.lab_resource_platform.dto;

import com.example.lab_resource_platform.entity.CalibrationRecord;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor
public class CalibrationResponse {
    private Long id;
    private Long equipmentId;
    private String equipmentName;
    private CalibrationRecord.RecordType recordType;
    private LocalDate performedDate;
    private LocalDate nextDueDate;
    private String performedBy;
    private String result;
    private String certificateRef;
    private String notes;
    private LocalDateTime createdAt;

    public static CalibrationResponse from(CalibrationRecord c) {
        return CalibrationResponse.builder()
                .id(c.getId())
                .equipmentId(c.getEquipment().getId())
                .equipmentName(c.getEquipment().getEquipmentName())
                .recordType(c.getRecordType())
                .performedDate(c.getPerformedDate())
                .nextDueDate(c.getNextDueDate())
                .performedBy(c.getPerformedBy())
                .result(c.getResult())
                .certificateRef(c.getCertificateRef())
                .notes(c.getNotes())
                .createdAt(c.getCreatedAt())
                .build();
    }
}