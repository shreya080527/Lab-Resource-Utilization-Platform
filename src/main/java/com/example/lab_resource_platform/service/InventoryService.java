package com.example.lab_resource_platform.service;

import com.example.lab_resource_platform.entity.Inventory;
import java.util.List;

public interface InventoryService {

    Inventory addInventory(Inventory inventory);

    List<Inventory> getAllInventory();

    Inventory getInventoryById(Long id);

    Inventory updateInventory(Long id, Inventory inventory);

    void deleteInventory(Long id);

}