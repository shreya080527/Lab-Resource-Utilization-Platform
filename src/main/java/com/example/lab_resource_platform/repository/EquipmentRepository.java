package com.example.lab_resource_platform.repository;

import com.example.lab_resource_platform.entity.Equipment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EquipmentRepository extends JpaRepository<Equipment, Long> {

}