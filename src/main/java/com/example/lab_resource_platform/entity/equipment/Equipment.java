package com.example.lab_resource_platform.entity.equipment;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "equipments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Equipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String serial; //serialNumber — unique physical identifier

    @Column(nullable = false)
    private String equipmentName;

    private String category;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(updatable = false)
    private LocalDateTime acquisitionDate;

    private String institution; //(who legally owns it)

    @Column(nullable = false, updatable = false)
    private String addedBy;

    @Enumerated(EnumType.STRING)
    private EquipmentStatus status;

    @PrePersist
    protected void onCreate() {
        this.acquisitionDate = LocalDateTime.now();
    }
}