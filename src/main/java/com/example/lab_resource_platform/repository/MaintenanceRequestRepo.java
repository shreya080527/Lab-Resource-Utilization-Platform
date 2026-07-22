package com.example.lab_resource_platform.repository;

import com.example.lab_resource_platform.entity.MaintenanceRequest;
import com.example.lab_resource_platform.entity.MaintenanceRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaintenanceRequestRepo extends JpaRepository<MaintenanceRequest, Long> {

    /** All requests — for LAB_MANAGER / admin dashboards. */
    List<MaintenanceRequest> findAllByOrderByCreatedAtDesc();

    /** Requests assigned to a specific technician. */
    List<MaintenanceRequest> findByAssignedToIdOrderByCreatedAtDesc(Long technicianId);

    /** Requests raised by a specific manager. */
    List<MaintenanceRequest> findByRequestedByIdOrderByCreatedAtDesc(Long managerId);

    /** Requests for a specific equipment. */
    List<MaintenanceRequest> findByEquipmentIdOrderByCreatedAtDesc(Long equipmentId);

    /** Active (non-terminal) requests for an equipment — used to block duplicate maintenance. */
    @Query("SELECT m FROM MaintenanceRequest m WHERE m.equipment.id = :equipmentId " +
           "AND m.status IN :statuses ORDER BY m.createdAt DESC")
    List<MaintenanceRequest> findActiveForEquipment(@Param("equipmentId") Long equipmentId,
                                                    @Param("statuses") List<MaintenanceRequestStatus> statuses);

    /** Count of active requests assigned to a technician. */
    long countByAssignedToIdAndStatusIn(Long technicianId, List<MaintenanceRequestStatus> statuses);
}
