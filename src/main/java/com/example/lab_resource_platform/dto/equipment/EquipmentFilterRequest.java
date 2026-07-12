package com.example.lab_resource_platform.dto.equipment;

import com.example.lab_resource_platform.entity.equipment.EquipmentStatus;
import lombok.Data;

@Data
public class EquipmentFilterRequest {
    private String category;
    private String tag;
    private Long departmentId;
    private Long institutionId;
    private EquipmentStatus status;
    private String search;
}