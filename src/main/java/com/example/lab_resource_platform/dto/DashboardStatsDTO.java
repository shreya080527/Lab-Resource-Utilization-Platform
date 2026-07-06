package com.example.lab_resource_platform.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DashboardStatsDTO {

    private Long totalEquipment;

    private Integer totalQuantity;

    private Integer availableQuantity;

    private Integer reservedQuantity;

    private Integer maintenanceQuantity;

    private Integer lowStockCount;

}