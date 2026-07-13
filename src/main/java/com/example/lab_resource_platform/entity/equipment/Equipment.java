package com.example.lab_resource_platform.entity.equipment;

import com.example.lab_resource_platform.entity.Department;
import com.example.lab_resource_platform.entity.Institution;
import com.example.lab_resource_platform.entity.Tag;
import com.example.lab_resource_platform.entity.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "equipments")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Equipment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String serial;

    @Column(nullable = false)
    private String equipmentName;

    private String category;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(updatable = false)
    private LocalDateTime acquisitionDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institution_id")
    private Institution institution;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "added_by")
    private User addedBy;

    @Enumerated(EnumType.STRING)
    private EquipmentStatus status;

    @ManyToMany
    @JoinTable(
            name = "equipment_tags",
            joinColumns = @JoinColumn(name = "equipment_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    @Builder.Default
    private Set<Tag> tags = new HashSet<>();

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.acquisitionDate == null) this.acquisitionDate = LocalDateTime.now();
        if (this.status == null) this.status = EquipmentStatus.AVAILABLE;
    }

    @PreUpdate
    void onUpdate() { this.updatedAt = LocalDateTime.now(); }
}