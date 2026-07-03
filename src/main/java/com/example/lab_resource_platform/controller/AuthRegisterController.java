package com.example.lab_resource_platform.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.lab_resource_platform.dto.SignupRequest;
import com.example.lab_resource_platform.service.UserRegisterService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthRegisterController {

    private final UserRegisterService userService;

    @PostMapping("/signup")
    public ResponseEntity<String> register(@RequestBody SignupRequest request) {
        return ResponseEntity.ok(userService.register(request));
    }
}