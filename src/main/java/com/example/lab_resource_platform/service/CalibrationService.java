package com.example.lab_resource_platform.service;

import com.example.lab_resource_platform.dto.CalibrationRequest;
import com.example.lab_resource_platform.dto.CalibrationResponse;
import com.example.lab_resource_platform.entity.CalibrationRecord;
import com.example.lab_resource_platform.entity.equipment.Equipment;
import com.example.lab_resource_platform.repository.CalibrationRecordRepo;
import com.example.lab_resource_platform.repository.equipment.EquipmentRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CalibrationService {
    private final CalibrationRecordRepo calibrationRepo;
    private final EquipmentRepo equipmentRepo;

    @Transactional
    public CalibrationResponse create(Long equipmentId, CalibrationRequest req) {
        Equipment equipment = equipmentRepo.findById(equipmentId)
                .orElseThrow(() -> new RuntimeException("Equipment not found: " + equipmentId));
        CalibrationRecord rec = CalibrationRecord.builder()
                .equipment(equipment)
                .recordType(req.getRecordType())
                .performedDate(req.getPerformedDate())
                .nextDueDate(req.getNextDueDate())
                .performedBy(req.getPerformedBy())
                .result(req.getResult())
                .certificateRef(req.getCertificateRef())
                .notes(req.getNotes())
                .build();
        return CalibrationResponse.from(calibrationRepo.save(rec));
    }

    @Transactional(readOnly = true)
    public List<CalibrationResponse> findByEquipment(Long equipmentId) {
        return calibrationRepo.findByEquipmentIdOrderByPerformedDateDesc(equipmentId)
                .stream().map(CalibrationResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<CalibrationResponse> findDueForEquipment(Long equipmentId, LocalDate from, LocalDate to) {
        return calibrationRepo.findDueForEquipment(equipmentId, from, to)
                .stream().map(CalibrationResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<CalibrationResponse> findDueBetween(LocalDate from, LocalDate to) {
        return calibrationRepo.findDueBetween(from, to)
                .stream().map(CalibrationResponse::from).toList();
    }
}