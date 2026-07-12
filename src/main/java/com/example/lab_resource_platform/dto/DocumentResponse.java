package com.example.lab_resource_platform.dto;

import com.example.lab_resource_platform.entity.EquipmentDocument;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor
public class DocumentResponse {
    private Long id;
    private Long equipmentId;
    private String docName;
    private String docUrl;
    private String docType;
    private LocalDateTime uploadedAt;

    public static DocumentResponse from(EquipmentDocument d) {
        return DocumentResponse.builder()
                .id(d.getId())
                .equipmentId(d.getEquipment().getId())
                .docName(d.getDocName())
                .docUrl(d.getDocUrl())
                .docType(d.getDocType())
                .uploadedAt(d.getUploadedAt())
                .build();
    }
}
