package com.example.lab_resource_platform.dto;


import com.example.lab_resource_platform.entity.Waitlist;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.time.Duration;
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
    
    // Enhanced fields
    private Long waitingDurationMinutes;
    private String waitingDurationFormatted;
    private Long equipmentDepartmentId;
    private String equipmentDepartmentName;

    public static WaitlistResponse from(Waitlist w) {
        // Calculate waiting duration
        LocalDateTime now = LocalDateTime.now();
        long waitingMinutes = Duration.between(w.getCreatedAt(), now).toMinutes();
        String formattedDuration = formatDuration(waitingMinutes);
        
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
                .waitingDurationMinutes(waitingMinutes)
                .waitingDurationFormatted(formattedDuration)
                .equipmentDepartmentId(w.getEquipment().getDepartment() != null ? w.getEquipment().getDepartment().getId() : null)
                .equipmentDepartmentName(w.getEquipment().getDepartment() != null ? w.getEquipment().getDepartment().getName() : null)
                .build();
    }
    
    private static String formatDuration(long minutes) {
        if (minutes < 60) {
            return minutes + " min";
        } else if (minutes < 1440) {
            long hours = minutes / 60;
            long mins = minutes % 60;
            return mins > 0 ? hours + "h " + mins + "m" : hours + "h";
        } else {
            long days = minutes / 1440;
            long hours = (minutes % 1440) / 60;
            return hours > 0 ? days + "d " + hours + "h" : days + "d";
        }
    }
}
