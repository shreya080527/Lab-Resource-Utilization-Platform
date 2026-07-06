package com.example.lab_resource_platform.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "User name required")
    private String email;
    private String password;
}