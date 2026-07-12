package com.example.lab_resource_platform.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import java.util.List;

@Data
public class TagRequest {
    @NotEmpty(message = "At least one tag name is required")
    private List<String> tagNames;
}
