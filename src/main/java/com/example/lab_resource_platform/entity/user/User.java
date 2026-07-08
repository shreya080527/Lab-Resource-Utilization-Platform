package com.example.lab_resource_platform.entity.user;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
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