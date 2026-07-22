package com.example.lab_resource_platform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request body for PUT /api/maintenance/{id}/complete
 *
 * Sent by the LAB_TECHNICIAN when finishing the maintenance work.
 */
@Data
public class CompleteMaintenanceRequest {

    @NotBlank(message = "Completion notes are required")
    @Size(min = 10, max = 2000, message = "Notes must be between 10 and 2000 characters")
    private String completionNotes;

    @NotBlank(message = "Result is required")
    @Pattern(regexp = "PASS|FAIL|N/A",
             message = "Result must be one of: PASS, FAIL, N/A")
    private String result;
}
