package com.example.lab_resource_platform.dto.equipment;

import com.example.lab_resource_platform.entity.equipment.EquipmentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateEquipmentStatusRequest {
    @NotNull
    private EquipmentStatus status;
}
