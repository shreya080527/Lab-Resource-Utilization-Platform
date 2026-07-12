package com.example.lab_resource_platform.service;

import com.example.lab_resource_platform.dto.equipment.CreateEquipmentRequest;
import com.example.lab_resource_platform.dto.equipment.EquipmentFilterRequest;
import com.example.lab_resource_platform.dto.equipment.EquipmentResponse;
import com.example.lab_resource_platform.dto.equipment.UpdateEquipmentRequest;
import com.example.lab_resource_platform.entity.Department;
import com.example.lab_resource_platform.entity.Institution;
import com.example.lab_resource_platform.entity.equipment.Equipment;
import com.example.lab_resource_platform.entity.equipment.EquipmentStatus;
import com.example.lab_resource_platform.entity.user.User;
import com.example.lab_resource_platform.entity.user.UserPrincipal;
import com.example.lab_resource_platform.repository.DepartmentRepo;
import com.example.lab_resource_platform.repository.InstitutionRepo;
import com.example.lab_resource_platform.repository.auth.UserRepo;
import com.example.lab_resource_platform.repository.equipment.EquipmentRepo;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EquipmentService {
    private final EquipmentRepo equipmentRepo;
    private final UserRepo userRepo;
    private final InstitutionRepo institutionRepo;
    private final DepartmentRepo departmentRepo;

    @Transactional
    public EquipmentResponse create(CreateEquipmentRequest request) {
        if (equipmentRepo.existsBySerial(request.getSerial())) {
            throw new RuntimeException("Equipment with serial " + request.getSerial() + " already exists");
        }
        User currentUser = getCurrentUser();
        Institution institution = request.getInstitutionId() != null
                ? institutionRepo.findById(request.getInstitutionId()).orElse(null) : null;
        Department department = request.getDepartmentId() != null
                ? departmentRepo.findById(request.getDepartmentId()).orElse(null) : null;

        Equipment equipment = Equipment.builder()
                .serial(request.getSerial())
                .equipmentName(request.getEquipmentName())
                .category(request.getCategory())
                .description(request.getDescription())
                .institution(institution)
                .department(department)
                .addedBy(currentUser)
                .status(EquipmentStatus.AVAILABLE)
                .build();
        return EquipmentResponse.from(equipmentRepo.save(equipment));
    }

    @Transactional(readOnly = true)
    public EquipmentResponse getById(Long id) {
        return EquipmentResponse.from(findById(id));
    }

    @Transactional(readOnly = true)
    public Equipment findById(Long id) {
        return equipmentRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Equipment not found: " + id));
    }

    @Transactional
    public EquipmentResponse update(Long id, UpdateEquipmentRequest request) {
        Equipment equipment = findById(id);
        if (request.getEquipmentName() != null) equipment.setEquipmentName(request.getEquipmentName());
        if (request.getCategory() != null) equipment.setCategory(request.getCategory());
        if (request.getDescription() != null) equipment.setDescription(request.getDescription());
        if (request.getInstitutionId() != null) {
            equipment.setInstitution(institutionRepo.findById(request.getInstitutionId()).orElse(null));
        }
        if (request.getDepartmentId() != null) {
            equipment.setDepartment(departmentRepo.findById(request.getDepartmentId()).orElse(null));
        }
        return EquipmentResponse.from(equipmentRepo.save(equipment));
    }

    @Transactional
    public void delete(Long id) {
        Equipment equipment = findById(id);
        equipment.setStatus(EquipmentStatus.RETIRED);
        equipmentRepo.save(equipment);
    }

    @Transactional(readOnly = true)
    public List<EquipmentResponse> getAll() {
        return equipmentRepo.findAll().stream().map(EquipmentResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<EquipmentResponse> getMyEquipments() {
        User currentUser = getCurrentUser();
        return equipmentRepo.findByAddedById(currentUser.getId())
                .stream().map(EquipmentResponse::from).toList();
    }

    @Transactional
    public EquipmentResponse updateStatus(Long id, EquipmentStatus status) {
        Equipment equipment = findById(id);
        equipment.setStatus(status);
        return EquipmentResponse.from(equipmentRepo.save(equipment));
    }

    @Transactional(readOnly = true)
    public Page<EquipmentResponse> filter(EquipmentFilterRequest filter, Pageable pageable) {
        Specification<Equipment> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (filter.getCategory() != null) {
                predicates.add(cb.equal(root.get("category"), filter.getCategory()));
            }
            if (filter.getStatus() != null) {
                predicates.add(cb.equal(root.get("status"), filter.getStatus()));
            }
            if (filter.getDepartmentId() != null) {
                predicates.add(cb.equal(root.get("department").get("id"), filter.getDepartmentId()));
            }
            if (filter.getInstitutionId() != null) {
                predicates.add(cb.equal(root.get("institution").get("id"), filter.getInstitutionId()));
            }
            if (filter.getSearch() != null && !filter.getSearch().isBlank()) {
                String like = "%" + filter.getSearch().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("equipmentName")), like),
                        cb.like(cb.lower(root.get("serial")), like)
                ));
            }
            if (filter.getTag() != null) {
                predicates.add(root.join("tags").get("name").in(filter.getTag()));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return equipmentRepo.findAll(spec, pageable).map(EquipmentResponse::from);
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        return userRepo.findByEmail(principal.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}