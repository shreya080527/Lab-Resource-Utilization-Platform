package com.example.lab_resource_platform.entity.user;

import com.example.lab_resource_platform.entity.Department;
import com.example.lab_resource_platform.entity.Institution;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private Boolean emailVerified = false;

    private String verificationOtp;
    private java.time.LocalDateTime otpGeneratedTime;

    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private Role role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institution_id")
    private Institution institution;
    
    // Profile fields
    private String name;
    private String phoneNumber;
    private String address;
    private String designation;
    
    @Column(name = "profile_picture_url")
    private String profilePictureUrl;
}