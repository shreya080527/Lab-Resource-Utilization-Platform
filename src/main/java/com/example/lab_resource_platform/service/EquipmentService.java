package com.example.lab_resource_platform.service;

import com.example.lab_resource_platform.dto.equipment.CreateEquipmentRequest;
import com.example.lab_resource_platform.dto.equipment.EquipmentResponse;
import com.example.lab_resource_platform.dto.equipment.UpdateEquipmentRequest;
import com.example.lab_resource_platform.dto.equipment.UpdateEquipmentStatusRequest;
import com.example.lab_resource_platform.entity.equipment.Equipment;
import com.example.lab_resource_platform.entity.equipment.EquipmentStatus;
import com.example.lab_resource_platform.entity.user.User;
import com.example.lab_resource_platform.entity.user.UserPrincipal;
import com.example.lab_resource_platform.repository.auth.UserRepo;
import com.example.lab_resource_platform.repository.equipment.EquipmentRepo;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.PipedOutputStream;
import java.util.List;

import static com.example.lab_resource_platform.entity.equipment.EquipmentStatus.RETIRED;

@Service

public class EquipmentService {

    @Autowired
    private EquipmentRepo equipmentRepo;

    @Autowired
    private UserRepo userRepo;

    @Transactional
    public EquipmentResponse create(CreateEquipmentRequest request) {

        if (equipmentRepo.existsBySerial(request.getSerial())) {
            throw new RuntimeException("Equipment with serial " + request.getSerial() + " already exists");
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        User currentUser = userRepo.findByEmail(principal.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Equipment equipment = new Equipment();
        equipment.setSerial(request.getSerial());
        equipment.setAddedBy(currentUser.getUsername());
        equipment.setEquipmentName(request.getEquipmentName());
        equipment.setCategory(request.getCategory());
        equipment.setDescription(request.getDescription());
        equipment.setInstitution(request.getInstitution());
        equipment.setStatus(EquipmentStatus.AVAILABLE);

        return EquipmentResponse.from(equipmentRepo.save(equipment));
    }


    public Equipment update(@Valid UpdateEquipmentRequest request, Long id) {
        Equipment equipment = equipmentRepo.findById(id)
                .orElseThrow(()-> new RuntimeException("Equipment not found"));

        if(null != request.getEquipmentName()){
            equipment.setEquipmentName(request.getEquipmentName());
        }
        if(null != request.getDescription()){
            equipment.setDescription(request.getDescription());
        }
        if(null != request.getCategory()){
            equipment.setCategory(request.getCategory());
        }
        if(null != request.getInstitution()){
            equipment.setInstitution(request.getInstitution());
        }

        return equipmentRepo.save(equipment);
    }

    //not actually deleting just marking as retired, because other services refer to this
    public void delete( Long id) {
        Equipment equipment = equipmentRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Equipment not found"));
        equipment.setStatus(RETIRED);
        equipmentRepo.save(equipment);
    }

    public List<Equipment> getAllEquipments() {
        List<Equipment> equipments = equipmentRepo.findAll();
        return equipments;
    }

    public Equipment updateStatus(@Valid UpdateEquipmentStatusRequest request, Long id) {

        Equipment equipment = equipmentRepo.findById(id).orElseThrow(()-> new RuntimeException("Equipment Not Found"));
        equipment.setStatus(request.getStatus());
        return equipmentRepo.save(equipment);
    }

    public List<Equipment> getMyEquipments() {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        User currentUser = userRepo.findByEmail(principal.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Equipment> equipments = equipmentRepo.findByAddedBy(currentUser.getUsername());
        return  equipments;
    }
}


