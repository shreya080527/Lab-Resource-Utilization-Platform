package com.example.lab_resource_platform.dto.auth;

import com.example.lab_resource_platform.entity.user.Role;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GetUserDetailsResponse {

    private Long id;
    private String username;
    private String email;
    private Role role;
    private boolean emailVerified;
    private String department;
    private String institution;


}
