package com.example.lab_resource_platform.controller.equipment;

import com.example.lab_resource_platform.dto.equipment.CreateEquipmentRequest;
import com.example.lab_resource_platform.dto.equipment.EquipmentResponse;
import com.example.lab_resource_platform.dto.equipment.UpdateEquipmentRequest;
import com.example.lab_resource_platform.dto.equipment.UpdateEquipmentStatusRequest;
import com.example.lab_resource_platform.service.EquipmentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/equipment")
public class EquipmentController {

    @Autowired
    private EquipmentService equipmentService;

//    RESEARCHER,
//    LAB_TECHNICIAN,
//    LAB_MANAGER,
//    DEPARTMENT_HEAD,
//    INSTITUTION_ADMIN,
//    SYSTEM_ADMIN

    //add equipment
    @PostMapping("add-equipment")
    @PreAuthorize("hasAnyRole('LAB_MANAGER', 'SYSTEM_ADMIN', ' DEPARTMENT_HEAD', '  INSTITUTION_ADMIN', 'LAB_TECHNICIAN')")
    public ResponseEntity<?> create(@Valid @RequestBody CreateEquipmentRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(equipmentService.create(request));
        }catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    //update an existing equipment
    @PutMapping("update-equipment/{id}")
    @PreAuthorize("hasAnyRole('LAB_MANAGER', 'SYSTEM_ADMIN', ' DEPARTMENT_HEAD', '  INSTITUTION_ADMIN', 'LAB_TECHNICIAN')")
    public ResponseEntity<?> update(@Valid @RequestBody UpdateEquipmentRequest request, @PathVariable Long id) {
        try {
            return ResponseEntity.ok().body(equipmentService.update(request,id));
        }catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    //delete equipment
    @DeleteMapping("delete-equipment/{id}")
    @PreAuthorize("hasAnyRole('LAB_MANAGER', 'SYSTEM_ADMIN', ' DEPARTMENT_HEAD', '  INSTITUTION_ADMIN', 'LAB_TECHNICIAN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            equipmentService.delete(id);
            return ResponseEntity.ok("Equipment Deleted Successfully");
        }catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    //get all equipments
    @GetMapping("get-all-equipments")
    @PreAuthorize("hasAnyRole('LAB_MANAGER', 'SYSTEM_ADMIN', ' DEPARTMENT_HEAD', '  INSTITUTION_ADMIN', 'LAB_TECHNICIAN')")
    public ResponseEntity<?> getAllEquipments() {
        try {
            return ResponseEntity.ok( equipmentService.getAllEquipments());
        }catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    //get my equipments
    @GetMapping("get-my-equipments")
    @PreAuthorize("hasAnyRole('LAB_MANAGER', 'SYSTEM_ADMIN', ' DEPARTMENT_HEAD', '  INSTITUTION_ADMIN', 'LAB_TECHNICIAN')")
    public ResponseEntity<?> getMyEquipments() {
        try {
            return ResponseEntity.ok( equipmentService.getMyEquipments());
        }catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    //update equipment status
    @PutMapping("update-equipment-status/{id}")
    @PreAuthorize("hasAnyRole('LAB_MANAGER', 'SYSTEM_ADMIN', ' DEPARTMENT_HEAD', '  INSTITUTION_ADMIN', 'LAB_TECHNICIAN')")
    public ResponseEntity<?> updateStatus(@Valid @RequestBody UpdateEquipmentStatusRequest request, @PathVariable Long id) {
        try {
            return ResponseEntity.ok( equipmentService.updateStatus(request, id));
        }catch (Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

}
