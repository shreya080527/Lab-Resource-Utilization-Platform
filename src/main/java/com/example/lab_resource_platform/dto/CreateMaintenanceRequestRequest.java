package com.example.lab_resource_platform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request body for POST /api/maintenance
 *
 * Sent by the LAB_MANAGER when raising a new maintenance request.
 */
@Data
public class CreateMaintenanceRequestRequest {

    @NotNull(message = "Equipment ID is required")
    private Long equipmentId;

    @NotNull(message = "Assigned technician ID is required")
    private Long assignedToId;

    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 2000, message = "Description must be between 10 and 2000 characters")
    private String description;

    @NotBlank(message = "Priority is required")
    @Pattern(regexp = "LOW|MEDIUM|HIGH|CRITICAL",
             message = "Priority must be one of: LOW, MEDIUM, HIGH, CRITICAL")
    private String priority;
}
