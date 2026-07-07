package com.example.lab_resource_platform.repository.equipment;

import com.example.lab_resource_platform.entity.equipment.Equipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface EquipmentRepo extends JpaRepository<Equipment,Long> {
    boolean existsBySerial(String serial);}
