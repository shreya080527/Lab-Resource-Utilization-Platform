package com.example.lab_resource_platform.service;

import com.example.lab_resource_platform.entity.Inventory;
import com.example.lab_resource_platform.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {

    private final InventoryRepository inventoryRepository;

    @Override
    public Inventory addInventory(Inventory inventory) {
        return inventoryRepository.save(inventory);
    }

    @Override
    public List<Inventory> getAllInventory() {
        return inventoryRepository.findAll();
    }

    @Override
    public Inventory getInventoryById(Long id) {
        return inventoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventory not found"));
    }

    @Override
    public Inventory updateInventory(Long id, Inventory inventory) {

        Inventory oldInventory = getInventoryById(id);

        oldInventory.setTotalQuantity(inventory.getTotalQuantity());
        oldInventory.setAvailableQuantity(inventory.getAvailableQuantity());
        oldInventory.setReservedQuantity(inventory.getReservedQuantity());
        oldInventory.setMaintenanceQuantity(inventory.getMaintenanceQuantity());
        oldInventory.setMinimumStock(inventory.getMinimumStock());

        return inventoryRepository.save(oldInventory);
    }

    @Override
    public void deleteInventory(Long id) {
        inventoryRepository.deleteById(id);
    }
}