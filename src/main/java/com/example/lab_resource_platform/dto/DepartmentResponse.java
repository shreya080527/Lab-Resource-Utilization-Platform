package com.example.lab_resource_platform.dto;

import com.example.lab_resource_platform.entity.Department;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor
public class DepartmentResponse {
    private Long id;
    private String name;
    private InstitutionResponse institution;
    private LocalDateTime createdAt;

    public static DepartmentResponse from(Department d) {
        return DepartmentResponse.builder()
                .id(d.getId())
                .name(d.getName())
                .institution(InstitutionResponse.from(d.getInstitution()))
                .createdAt(d.getCreatedAt())
                .build();
    }
}