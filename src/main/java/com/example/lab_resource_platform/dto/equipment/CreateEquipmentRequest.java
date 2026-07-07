package com.example.lab_resource_platform.dto.equipment;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateEquipmentRequest {

    @NotBlank
    private String serial;

    @NotBlank
    private String equipmentName;

    private String category;

    private String description;

    private String institution;

}
