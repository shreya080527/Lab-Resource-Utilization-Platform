package com.example.lab_resource_platform.dto.equipment;


import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateEquipmentRequest {
    @NotBlank(message = "Serial is required")
    private String serial;
    @NotBlank(message = "Equipment name is required")
    private String equipmentName;
    private String category;
    private String description;
    private Long institutionId;
    private Long departmentId;
}
