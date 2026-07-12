package com.example.lab_resource_platform.entity;

import com.example.lab_resource_platform.entity.equipment.Equipment;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "equipment_documents")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class EquipmentDocument {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "equipment_id", nullable = false)
    private Equipment equipment;

    @Column(nullable = false)
    private String docName;

    @Column(nullable = false)
    private String docUrl;

    @Column(nullable = false)
    private String docType; // MANUAL, DATASHEET, SPEC_SHEET, CERTIFICATE, OTHER

    @Column(updatable = false)
    private LocalDateTime uploadedAt;

    @PrePersist
    void onCreate() { this.uploadedAt = LocalDateTime.now(); }
}
