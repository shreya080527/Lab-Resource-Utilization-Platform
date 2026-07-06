package com.example.lab_resource_platform.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "equipment")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Equipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long equipmentId;

    @Column(nullable = false)
    private String equipmentName;

    private String category;

    @Column(length = 1000)
    private String description;

    private Integer quantity;

    private Integer availableQuantity;

    @Enumerated(EnumType.STRING)
    private EquipmentStatus status;
}