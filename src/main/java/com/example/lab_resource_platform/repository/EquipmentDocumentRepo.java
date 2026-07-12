package com.example.lab_resource_platform.repository;

import com.example.lab_resource_platform.entity.EquipmentDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EquipmentDocumentRepo extends JpaRepository<EquipmentDocument, Long> {
    List<EquipmentDocument> findByEquipmentId(Long equipmentId);
}