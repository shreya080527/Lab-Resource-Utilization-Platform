package com.example.lab_resource_platform.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.lab_resource_platform.dto.LoginRequest;
import com.example.lab_resource_platform.entity.User;
import com.example.lab_resource_platform.service.UserLoginService;

import jakarta.validation.Valid;


@RestController
@RequestMapping("/api/auth")
public class AuthLoginController {

    private final UserLoginService userService;

    public AuthLoginController(UserLoginService userService) {
        this.userService = userService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {

        User user = userService.login(request);

        return ResponseEntity.ok(user);
    }
}