package com.example.lab_resource_platform.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.lab_resource_platform.dto.SignupRequest;
import com.example.lab_resource_platform.entity.User;
import com.example.lab_resource_platform.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserRegisterService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;

    public String register(SignupRequest request) {
   	
        if (repository.existsByEmail(request.getEmail())) {
			return "Email already exists";
		}


        if (repository.existsByUsername(request.getUsername())) {
			return "Username already exists";
		}

        User user = new User();

        user.setFirstname(request.getFirstname());
        user.setLastname(request.getLastname());
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setDepartment(request.getDepartment());
        user.setInstitution(request.getInstitution());

        repository.save(user);

        return "User Registered Successfully";
    }
}