package com.example.lab_resource_platform.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.lab_resource_platform.entity.Equipment;
import com.example.lab_resource_platform.entity.Inventory;
import com.example.lab_resource_platform.repository.EquipmentRepository;
import com.example.lab_resource_platform.repository.InventoryRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final InventoryRepository inventoryRepository;

    // Add Equipment
    public Equipment addEquipment(Equipment equipment) {

        Equipment savedEquipment = equipmentRepository.save(equipment);

        Inventory inventory = Inventory.builder()
                .equipment(savedEquipment)
                .totalQuantity(savedEquipment.getQuantity())
                .availableQuantity(savedEquipment.getAvailableQuantity())
                .reservedQuantity(0)
                .maintenanceQuantity(0)
                .minimumStock(2)
                .build();

        inventoryRepository.save(inventory);

        return savedEquipment;
    }

    // Get All Equipment
    public List<Equipment> getAllEquipment() {
        return equipmentRepository.findAll();
    }

    // Get Equipment by ID
    public Equipment getEquipmentById(Long id) {
        return equipmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Equipment not found"));
    }

    // Update Equipment
    public Equipment updateEquipment(Long id, Equipment updatedEquipment) {

        Equipment equipment = getEquipmentById(id);

        equipment.setEquipmentName(updatedEquipment.getEquipmentName());
        equipment.setCategory(updatedEquipment.getCategory());
        equipment.setDescription(updatedEquipment.getDescription());
        equipment.setQuantity(updatedEquipment.getQuantity());
        equipment.setAvailableQuantity(updatedEquipment.getAvailableQuantity());
        equipment.setStatus(updatedEquipment.getStatus());

        Equipment updated = equipmentRepository.save(equipment);

        // Update Inventory automatically
        Inventory inventory = inventoryRepository.findByEquipment(updated)
                .orElse(null);

        if (inventory != null) {
            inventory.setTotalQuantity(updated.getQuantity());
            inventory.setAvailableQuantity(updated.getAvailableQuantity());
            inventoryRepository.save(inventory);
        }

        return updated;
    }

    // Delete Equipment
    public void deleteEquipment(Long id) {

        Equipment equipment = getEquipmentById(id);

        Inventory inventory = inventoryRepository.findByEquipment(equipment)
                .orElse(null);

        if (inventory != null) {
            inventoryRepository.delete(inventory);
        }

        equipmentRepository.delete(equipment);
    }
}