package com.example.lab_resource_platform.entity;

import com.example.lab_resource_platform.entity.equipment.Equipment;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "calibration_records")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CalibrationRecord {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "equipment_id", nullable = false)
    private Equipment equipment;

    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private RecordType recordType;

    @Column(nullable = false)
    private LocalDate performedDate;

    private LocalDate nextDueDate;

    private String performedBy;
    private String result;        // PASS, FAIL, N/A
    private String certificateRef;
    private String notes;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() { this.createdAt = LocalDateTime.now(); }

    public enum RecordType {
        CALIBRATION, CERTIFICATION, INSPECTION, MAINTENANCE_CHECK
    }
}
