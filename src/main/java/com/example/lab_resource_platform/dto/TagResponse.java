package com.example.lab_resource_platform.dto;

import com.example.lab_resource_platform.entity.Tag;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data @Builder @AllArgsConstructor
public class TagResponse {
    private Long id;
    private String name;

    public static TagResponse from(Tag t) {
        return TagResponse.builder().id(t.getId()).name(t.getName()).build();
    }
}
