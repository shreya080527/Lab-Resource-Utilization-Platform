package com.example.lab_resource_platform.controller;

import java.util.List;

import jakarta.annotation.PostConstruct;

import org.springframework.web.bind.annotation.*;

import com.example.lab_resource_platform.entity.Equipment;
import com.example.lab_resource_platform.service.EquipmentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/equipment")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class EquipmentController {

    private final EquipmentService equipmentService;

    @PostConstruct
    public void init() {
        System.out.println("EquipmentController Loaded Successfully");
    }

    // Test API
    @GetMapping("/test")
    public String test() {
        return "Equipment Controller Working";
    }

    // Add Equipment
    @PostMapping
    public Equipment addEquipment(@RequestBody Equipment equipment) {
        return equipmentService.addEquipment(equipment);
    }

    // Get All Equipment
    @GetMapping
    public List<Equipment> getAllEquipment() {
        return equipmentService.getAllEquipment();
    }

    // Get Equipment By ID
    @GetMapping("/{id}")
    public Equipment getEquipmentById(@PathVariable Long id) {
        return equipmentService.getEquipmentById(id);
    }

    // Update Equipment
    @PutMapping("/{id}")
    public Equipment updateEquipment(@PathVariable Long id,
                                     @RequestBody Equipment equipment) {
        return equipmentService.updateEquipment(id, equipment);
    }

    // Delete Equipment
    @DeleteMapping("/{id}")
    public void deleteEquipment(@PathVariable Long id) {
        equipmentService.deleteEquipment(id);
    }
}