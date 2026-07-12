package com.example.lab_resource_platform.service;


import com.example.lab_resource_platform.dto.DepartmentRequest;
import com.example.lab_resource_platform.dto.DepartmentResponse;
import com.example.lab_resource_platform.entity.Department;
import com.example.lab_resource_platform.entity.Institution;
import com.example.lab_resource_platform.repository.DepartmentRepo;
import com.example.lab_resource_platform.repository.InstitutionRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DepartmentService {
    private final DepartmentRepo departmentRepo;
    private final InstitutionRepo institutionRepo;

    @Transactional
    public DepartmentResponse create(DepartmentRequest req) {
        Institution inst = institutionRepo.findById(req.getInstitutionId())
                .orElseThrow(() -> new RuntimeException("Institution not found: " + req.getInstitutionId()));
        if (departmentRepo.existsByNameAndInstitutionId(req.getName(), req.getInstitutionId())) {
            throw new RuntimeException("Department '" + req.getName() + "' already exists in this institution");
        }
        Department dept = Department.builder()
                .name(req.getName())
                .institution(inst)
                .build();
        return DepartmentResponse.from(departmentRepo.save(dept));
    }

    @Transactional(readOnly = true)
    public List<DepartmentResponse> findAll(Long institutionId) {
        List<Department> list = (institutionId != null)
                ? departmentRepo.findByInstitutionId(institutionId)
                : departmentRepo.findAll();
        return list.stream().map(DepartmentResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public Department findById(Long id) {
        return departmentRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Department not found: " + id));
    }
}
