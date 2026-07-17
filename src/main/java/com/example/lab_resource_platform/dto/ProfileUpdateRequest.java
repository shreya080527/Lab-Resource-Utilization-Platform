package com.example.lab_resource_platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ProfileUpdateRequest {
    private String username;
    private String name;
    private String phoneNumber;
    private String address;
    private String designation;
    private Long departmentId;
}
