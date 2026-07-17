package com.example.lab_resource_platform.controller;

import com.example.lab_resource_platform.dto.ProfileUpdateRequest;
import com.example.lab_resource_platform.dto.auth.GetUserDetailsResponse;
import com.example.lab_resource_platform.entity.Department;
import com.example.lab_resource_platform.entity.user.User;
import com.example.lab_resource_platform.entity.user.UserPrincipal;
import com.example.lab_resource_platform.repository.DepartmentRepo;
import com.example.lab_resource_platform.repository.auth.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserRepo userRepo;
    private final DepartmentRepo departmentRepo;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<GetUserDetailsResponse> getCurrentUser(
            @AuthenticationPrincipal UserPrincipal principal) {
        User user = userRepo.findById(principal.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(GetUserDetailsResponse.from(user));
    }

    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<GetUserDetailsResponse> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody ProfileUpdateRequest request) {
        User user = userRepo.findById(principal.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (request.getUsername() != null && !request.getUsername().isEmpty()) {
            // Check if username is already taken by another user
            User existing = userRepo.findByUsername(request.getUsername()).orElse(null);
            if (existing != null && !existing.getId().equals(user.getId())) {
                throw new IllegalStateException("Username is already taken");
            }
            user.setUsername(request.getUsername());
        }
        
        if (request.getName() != null) user.setName(request.getName());
        if (request.getPhoneNumber() != null) user.setPhoneNumber(request.getPhoneNumber());
        if (request.getAddress() != null) user.setAddress(request.getAddress());
        if (request.getDesignation() != null) user.setDesignation(request.getDesignation());
        
        if (request.getDepartmentId() != null && 
            (user.getRole().name().equals("RESEARCHER") || user.getRole().name().equals("LAB_TECHNICIAN"))) {
            // Only allow changing department for certain roles
            Department dept = departmentRepo.findById(request.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException("Department not found"));
            user.setDepartment(dept);
        }
        
        user = userRepo.save(user);
        return ResponseEntity.ok(GetUserDetailsResponse.from(user));
    }

    @PutMapping("/me/password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> changePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, String> request) {
        String currentPassword = request.get("currentPassword");
        String newPassword = request.get("newPassword");
        
        if (currentPassword == null || newPassword == null) {
            throw new IllegalArgumentException("Current password and new password are required");
        }
        
        if (newPassword.length() < 6) {
            throw new IllegalArgumentException("New password must be at least 6 characters");
        }
        
        User user = userRepo.findById(principal.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalStateException("Current password is incorrect");
        }
        
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepo.save(user);
        
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }
}
