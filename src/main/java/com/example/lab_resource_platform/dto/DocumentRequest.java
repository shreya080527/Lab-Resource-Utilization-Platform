package com.example.lab_resource_platform.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DocumentRequest {
    @NotBlank(message = "Document name is required")
    private String docName;
    @NotBlank(message = "Document URL is required")
    private String docUrl;
    @NotBlank(message = "Document type is required")
    private String docType; // MANUAL, DATASHEET, SPEC_SHEET, CERTIFICATE, OTHER
}
