package com.example.lab_resource_platform.repository.equipment;


import com.example.lab_resource_platform.entity.equipment.Equipment;
import com.example.lab_resource_platform.entity.equipment.EquipmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EquipmentRepo extends JpaRepository<Equipment, Long>, JpaSpecificationExecutor<Equipment> {
    boolean existsBySerial(String serial);
    List<Equipment> findByAddedById(Long userId);
    List<Equipment> findByDepartmentId(Long departmentId);
    List<Equipment> findByInstitutionId(Long institutionId);
    List<Equipment> findByStatusNot(EquipmentStatus status);
    long countByStatus(EquipmentStatus status);
}