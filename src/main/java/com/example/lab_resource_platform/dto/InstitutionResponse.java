package com.example.lab_resource_platform.dto;

import com.example.lab_resource_platform.entity.Institution;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor
public class InstitutionResponse {
    private Long id;
    private String name;
    private String code;
    private LocalDateTime createdAt;

    public static InstitutionResponse from(Institution i) {
        return InstitutionResponse.builder()
                .id(i.getId()).name(i.getName())
                .code(i.getCode()).createdAt(i.getCreatedAt())
                .build();
    }
}