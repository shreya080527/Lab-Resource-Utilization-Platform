package com.example.lab_resource_platform.dto;

import com.example.lab_resource_platform.entity.Role;
import lombok.Data;

@Data
public class SignupRequest {
    private String email;
    private String password;
    private Role role;
}