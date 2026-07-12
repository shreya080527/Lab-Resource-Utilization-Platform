package com.example.lab_resource_platform.entity;

import com.example.lab_resource_platform.entity.Bookings.Booking;
import com.example.lab_resource_platform.entity.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "booking_audits")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class BookingAudit {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(nullable = false)
    private String action; // CREATED, ACCEPTED, REJECTED, CANCELLED, STARTED, COMPLETED, NO_SHOW, RECURRENCE_GENERATED

    private String fromStatus;
    private String toStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by_id")
    private User performedBy;

    private String notes;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() { this.createdAt = LocalDateTime.now(); }
}