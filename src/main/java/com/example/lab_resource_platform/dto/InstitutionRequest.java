package com.example.lab_resource_platform.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class InstitutionRequest {
    @NotBlank(message = "Institution name is required")
    private String name;
    private String code;
}