package com.example.lab_resource_platform.dto;

import com.example.lab_resource_platform.entity.Role;
import lombok.Data;

@Data
public class SignupRequest {

    private String firstname;
    private String lastname;
    private String username;

    private String email;
    private String password;

    private Role role;

    private String department;
    private String institution;
}