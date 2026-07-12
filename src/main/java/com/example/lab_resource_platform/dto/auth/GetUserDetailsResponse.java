package com.example.lab_resource_platform.dto.auth;

import com.example.lab_resource_platform.entity.Department;
import com.example.lab_resource_platform.entity.Institution;
import com.example.lab_resource_platform.entity.user.Role;
import com.example.lab_resource_platform.entity.user.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class GetUserDetailsResponse {
    private Long id;
    private String username;
    private String email;
    private Role role;
    private Boolean emailVerified;
    private DepartmentInfo department;
    private InstitutionInfo institution;

    // Nested DTOs so we don't leak lazy-loaded JPA entities
    @Data
    @Builder
    @AllArgsConstructor
    public static class DepartmentInfo {
        private Long id;
        private String name;
        private InstitutionInfo institution;
    }

    @Data
    @Builder
    @AllArgsConstructor
    public static class InstitutionInfo {
        private Long id;
        private String name;
        private String code;
    }

    public static GetUserDetailsResponse from(User user) {
        InstitutionInfo instInfo = (user.getInstitution() != null)
                ? InstitutionInfo.builder()
                .id(user.getInstitution().getId())
                .name(user.getInstitution().getName())
                .code(user.getInstitution().getCode())
                .build()
                : null;

        DepartmentInfo deptInfo = (user.getDepartment() != null)
                ? DepartmentInfo.builder()
                .id(user.getDepartment().getId())
                .name(user.getDepartment().getName())
                .institution(instInfo)   // reuse to avoid double-build
                .build()
                : null;

        return GetUserDetailsResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .emailVerified(user.getEmailVerified())
                .department(deptInfo)
                .institution(instInfo)
                .build();
    }
}