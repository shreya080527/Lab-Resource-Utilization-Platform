package com.example.lab_resource_platform.entity.equipment;

import com.example.lab_resource_platform.entity.user.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "equipments")
@Data
@NoArgsConstructor
@AllArgsConstructor
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