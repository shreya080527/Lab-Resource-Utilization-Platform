package com.example.lab_resource_platform.dto.equipment;

import com.example.lab_resource_platform.entity.equipment.Equipment;
import com.example.lab_resource_platform.entity.equipment.EquipmentStatus;
import com.example.lab_resource_platform.entity.user.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentResponse {

    private Long id;
    private String serial;
    private String equipmentName;
    private String category;
    private String description;
    private LocalDateTime acquisitionDate;
    private String institution;
    private EquipmentStatus status;
    private String addedBy;

    public static EquipmentResponse from(Equipment e) {
        EquipmentResponse response = new EquipmentResponse();
        response.setId(e.getId());
        response.setSerial(e.getSerial());
        response.setEquipmentName(e.getEquipmentName());
        response.setCategory(e.getCategory());
        response.setDescription(e.getDescription());
        response.setAcquisitionDate(e.getAcquisitionDate());
        response.setInstitution(e.getInstitution());
        response.setStatus(e.getStatus());
        response.setAddedBy(e.getAddedBy());
        return response;
    }
}
