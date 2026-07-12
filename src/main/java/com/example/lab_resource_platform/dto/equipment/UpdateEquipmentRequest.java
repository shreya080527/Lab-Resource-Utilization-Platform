package com.example.lab_resource_platform.dto.equipment;

import lombok.Data;

@Data
public class UpdateEquipmentRequest {
    private String equipmentName;
    private String category;
    private String description;
    private Long institutionId;
    private Long departmentId;
}