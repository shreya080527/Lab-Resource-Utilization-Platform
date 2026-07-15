package com.example.lab_resource_platform.dto;


import com.example.lab_resource_platform.entity.Waitlist;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor
public class WaitlistResponse {
    private Long id;
    private Long equipmentId;
    private String equipmentName;
    private Long userId;
    private String username;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer position;
    private Boolean notified;
    private LocalDateTime createdAt;

    public static WaitlistResponse from(Waitlist w) {
        return WaitlistResponse.builder()
                .id(w.getId())
                .equipmentId(w.getEquipment().getId())
                .equipmentName(w.getEquipment().getEquipmentName())
                .userId(w.getUser().getId())
                .username(w.getUser().getUsername())
                .startTime(w.getStartTime())
                .endTime(w.getEndTime())
                .position(w.getPosition())
                .notified(w.getNotified() != null ? w.getNotified() : false)
                .createdAt(w.getCreatedAt())
                .build();
    }
}
