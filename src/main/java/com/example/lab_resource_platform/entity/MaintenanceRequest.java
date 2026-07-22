package com.example.lab_resource_platform.entity;

import com.example.lab_resource_platform.entity.equipment.Equipment;
import com.example.lab_resource_platform.entity.equipment.EquipmentStatus;
import com.example.lab_resource_platform.entity.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * A maintenance request raised by a LAB_MANAGER and assigned to a LAB_TECHNICIAN.
 *
 * When the technician starts the work, the linked equipment is automatically
 * moved to UNDER_MAINTENANCE. When the technician completes the work, the
 * equipment reverts to AVAILABLE (unless it was OUT_OF_SERVICE / RETIRED).
 */
@Entity
@Table(name = "maintenance_requests")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class MaintenanceRequest {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The equipment that needs maintenance. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "equipment_id", nullable = false)
    private Equipment equipment;

    /** The LAB_MANAGER who raised the request. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requested_by_id", nullable = false)
    private User requestedBy;

    /** The LAB_TECHNICIAN assigned to perform the maintenance. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assigned_to_id", nullable = false)
    private User assignedTo;

    /** Current lifecycle status. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MaintenanceRequestStatus status;

    /** Free-text description of the issue / work needed. */
    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    /** Priority: LOW, MEDIUM, HIGH, CRITICAL. */
    @Column(nullable = false)
    private String priority;

    /** Snapshot of the equipment's status before maintenance started — used to restore on completion. */
    @Enumerated(EnumType.STRING)
    private EquipmentStatus equipmentStatusBeforeMaintenance;

    /** When the request was created. */
    @Column(updatable = false)
    private LocalDateTime createdAt;

    /** When the technician started the work (status → IN_PROGRESS). */
    private LocalDateTime startedAt;

    /** When the technician completed the work (status → COMPLETED). */
    private LocalDateTime completedAt;

    /** Free-text notes the technician writes when completing the work. */
    @Column(columnDefinition = "TEXT")
    private String completionNotes;

    /** PASS / FAIL / N/A — outcome of the maintenance. */
    private String result;

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) this.status = MaintenanceRequestStatus.REQUESTED;
    }
}
