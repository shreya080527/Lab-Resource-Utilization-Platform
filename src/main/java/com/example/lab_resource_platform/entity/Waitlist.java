package com.example.lab_resource_platform.entity;

import com.example.lab_resource_platform.entity.equipment.Equipment;
import com.example.lab_resource_platform.entity.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "waitlists")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Waitlist {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "equipment_id", nullable = false)
    private Equipment equipment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDateTime startTime;

    @Column(nullable = false)
    private LocalDateTime endTime;

    @Column(nullable = false)
    private Integer position;

    @Column(name = "notified", nullable = false)
    private Boolean notified = false;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() { 
        this.createdAt = LocalDateTime.now();
        if (this.notified == null) this.notified = false;
    }
}