package com.example.lab_resource_platform.dto.equipment;

import com.example.lab_resource_platform.dto.DepartmentResponse;
import com.example.lab_resource_platform.dto.InstitutionResponse;
import com.example.lab_resource_platform.dto.TagResponse;
import com.example.lab_resource_platform.entity.equipment.Equipment;
import com.example.lab_resource_platform.entity.equipment.EquipmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

@Data @Builder @AllArgsConstructor
public class EquipmentResponse {
    private Long id;
    private String serial;
    private String equipmentName;
    private String category;
    private String description;
    private LocalDateTime acquisitionDate;
    private InstitutionResponse institution;
    private DepartmentResponse department;
    private String addedByUsername;
    private EquipmentStatus status;
    private Set<TagResponse> tags;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static EquipmentResponse from(Equipment e) {
        return EquipmentResponse.builder()
                .id(e.getId())
                .serial(e.getSerial())
                .equipmentName(e.getEquipmentName())
                .category(e.getCategory())
                .description(e.getDescription())
                .acquisitionDate(e.getAcquisitionDate())
                .institution(e.getInstitution() != null ? InstitutionResponse.from(e.getInstitution()) : null)
                .department(e.getDepartment() != null ? DepartmentResponse.from(e.getDepartment()) : null)
                .addedByUsername(e.getAddedBy() != null ? e.getAddedBy().getUsername() : null)
                .status(e.getStatus())
                .tags(e.getTags() != null
                        ? e.getTags().stream().map(TagResponse::from).collect(Collectors.toSet())
                        : null)
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }
}