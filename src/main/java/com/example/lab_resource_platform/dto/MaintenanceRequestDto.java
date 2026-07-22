package com.example.lab_resource_platform.dto;

import com.example.lab_resource_platform.entity.MaintenanceRequest;
import com.example.lab_resource_platform.entity.MaintenanceRequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * DTO returned to the frontend for a maintenance request.
 * Flattens the equipment, requestedBy, and assignedTo associations into simple fields
 * so the frontend doesn't need to deal with lazy-loaded JPA proxies.
 */
@Data
@Builder
@AllArgsConstructor
public class MaintenanceRequestDto {
    private Long id;

    // ─── Equipment ───
    private Long equipmentId;
    private String equipmentName;
    private String equipmentSerial;
    private String equipmentCategory;

    // ─── People ───
    private Long requestedById;
    private String requestedByUsername;
    private Long assignedToId;
    private String assignedToUsername;

    // ─── State ───
    private MaintenanceRequestStatus status;
    private String priority;
    private String description;

    // ─── Timeline ───
    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    // ─── Completion ───
    private String completionNotes;
    private String result;

    public static MaintenanceRequestDto from(MaintenanceRequest m) {
        return MaintenanceRequestDto.builder()
                .id(m.getId())
                .equipmentId(m.getEquipment().getId())
                .equipmentName(m.getEquipment().getEquipmentName())
                .equipmentSerial(m.getEquipment().getSerial())
                .equipmentCategory(m.getEquipment().getCategory())
                .requestedById(m.getRequestedBy().getId())
                .requestedByUsername(m.getRequestedBy().getUsername())
                .assignedToId(m.getAssignedTo().getId())
                .assignedToUsername(m.getAssignedTo().getUsername())
                .status(m.getStatus())
                .priority(m.getPriority())
                .description(m.getDescription())
                .createdAt(m.getCreatedAt())
                .startedAt(m.getStartedAt())
                .completedAt(m.getCompletedAt())
                .completionNotes(m.getCompletionNotes())
                .result(m.getResult())
                .build();
    }
}
