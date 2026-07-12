package com.example.lab_resource_platform.dto;


import lombok.AllArgsConstructor;
import lombok.Data;

@Data @AllArgsConstructor
public class EquipmentUtilizationDTO {
    private Long equipmentId;
    private String equipmentName;
    private double bookedHours;
    private double availableHours;
    private double utilizationPercentage;
}