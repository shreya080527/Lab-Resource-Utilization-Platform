package com.example.lab_resource_platform.dto;

import com.example.lab_resource_platform.entity.user.Role;
import com.example.lab_resource_platform.entity.user.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

/**
 * Lightweight user DTO for list responses (e.g. the technician dropdown on the
 * maintenance request form). Avoids serializing lazy-loaded JPA proxies and
 * sensitive fields like password / OTP.
 */
@Data
@Builder
@AllArgsConstructor
public class UserSummaryDto {
    private Long id;
    private String username;
    private String email;
    private Role role;
    private Boolean emailVerified;
    private String name;
    private String designation;
    private Long departmentId;
    private String departmentName;
    private Long institutionId;
    private String institutionName;

    public static UserSummaryDto from(User u) {
        return UserSummaryDto.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .role(u.getRole())
                .emailVerified(u.getEmailVerified())
                .name(u.getName())
                .designation(u.getDesignation())
                .departmentId(u.getDepartment() != null ? u.getDepartment().getId() : null)
                .departmentName(u.getDepartment() != null ? u.getDepartment().getName() : null)
                .institutionId(u.getInstitution() != null ? u.getInstitution().getId() : null)
                .institutionName(u.getInstitution() != null ? u.getInstitution().getName() : null)
                .build();
    }
}
