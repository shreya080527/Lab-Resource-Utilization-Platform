package com.example.lab_resource_platform.service;


import com.example.lab_resource_platform.dto.InstitutionRequest;
import com.example.lab_resource_platform.dto.InstitutionResponse;
import com.example.lab_resource_platform.entity.Institution;
import com.example.lab_resource_platform.repository.InstitutionRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InstitutionService {
    private final InstitutionRepo institutionRepo;

    @Transactional
    public InstitutionResponse create(InstitutionRequest req) {
        if (institutionRepo.existsByName(req.getName())) {
            throw new RuntimeException("Institution '" + req.getName() + "' already exists");
        }
        Institution inst = Institution.builder()
                .name(req.getName())
                .code(req.getCode())
                .build();
        return InstitutionResponse.from(institutionRepo.save(inst));
    }

    @Transactional(readOnly = true)
    public List<InstitutionResponse> findAll() {
        return institutionRepo.findAll().stream().map(InstitutionResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public Institution findById(Long id) {
        return institutionRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Institution not found: " + id));
    }
}