package com.example.lab_resource_platform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DepartmentRequest {
    @NotBlank(message = "Department name is required")
    private String name;
    @NotNull(message = "Institution ID is required")
    private Long institutionId;
}