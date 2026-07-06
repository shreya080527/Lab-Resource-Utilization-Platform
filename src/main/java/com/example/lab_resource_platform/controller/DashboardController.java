package com.example.lab_resource_platform.controller;

import com.example.lab_resource_platform.dto.DashboardStatsDTO;
import com.example.lab_resource_platform.entity.Inventory;
import com.example.lab_resource_platform.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class DashboardController {

    private final InventoryRepository inventoryRepository;

    @GetMapping("/stats")
    public DashboardStatsDTO getStats() {

        List<Inventory> inventories = inventoryRepository.findAll();

        long totalEquipment = inventories.size();

        int totalQuantity = 0;
        int availableQuantity = 0;
        int reservedQuantity = 0;
        int maintenanceQuantity = 0;
        int lowStockCount = 0;

        for (Inventory inventory : inventories) {

            totalQuantity += inventory.getTotalQuantity();
            availableQuantity += inventory.getAvailableQuantity();
            reservedQuantity += inventory.getReservedQuantity();
            maintenanceQuantity += inventory.getMaintenanceQuantity();

            if (inventory.getAvailableQuantity() <= inventory.getMinimumStock()) {
                lowStockCount++;
            }
        }

        return new DashboardStatsDTO(
                totalEquipment,
                totalQuantity,
                availableQuantity,
                reservedQuantity,
                maintenanceQuantity,
                lowStockCount
        );
    }
}