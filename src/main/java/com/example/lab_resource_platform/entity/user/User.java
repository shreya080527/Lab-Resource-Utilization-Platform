package com.example.lab_resource_platform.entity.user;

import com.example.lab_resource_platform.entity.Role;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "User name required")
    @Column(unique = true, nullable = false)
    private String username;

    @NotBlank(message = "Password Required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    @NotBlank(message = "Email required")
    @Email(message = "Invalid email format")
    @Column(unique = true, nullable = false)
    private String email;

    private Boolean emailVerified = false;
    private String verificationOtp;
    private LocalDateTime otpGeneratedTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @NotBlank(message = "Department required")
    private String Department;
    @NotBlank(message = "Institution required")
    private String Institution;


}