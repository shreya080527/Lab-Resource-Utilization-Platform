package com.example.lab_resource_platform.dto.equipment;

import com.example.lab_resource_platform.entity.equipment.EquipmentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateEquipmentStatusRequest {
    @NotNull(message = "Status is required")
    private EquipmentStatus status;
}