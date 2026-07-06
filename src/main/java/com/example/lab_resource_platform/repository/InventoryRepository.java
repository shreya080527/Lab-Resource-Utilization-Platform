package com.example.lab_resource_platform.repository;

import com.example.lab_resource_platform.entity.Inventory;
import com.example.lab_resource_platform.entity.Equipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    Optional<Inventory> findByEquipment(Equipment equipment);

}