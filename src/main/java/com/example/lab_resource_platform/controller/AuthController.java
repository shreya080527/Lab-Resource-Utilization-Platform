package com.example.lab_resource_platform.controller;

import com.example.lab_resource_platform.dto.AuthResponse;
import com.example.lab_resource_platform.dto.LoginRequest;
import com.example.lab_resource_platform.dto.SignupRequest;
import com.example.lab_resource_platform.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public String signup(@RequestBody SignupRequest request) {
        return authService.signup(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }
}