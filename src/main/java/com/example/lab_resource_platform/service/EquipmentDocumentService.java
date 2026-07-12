package com.example.lab_resource_platform.service;

import com.example.lab_resource_platform.dto.DocumentRequest;
import com.example.lab_resource_platform.dto.DocumentResponse;
import com.example.lab_resource_platform.entity.EquipmentDocument;
import com.example.lab_resource_platform.entity.equipment.Equipment;
import com.example.lab_resource_platform.repository.EquipmentDocumentRepo;
import com.example.lab_resource_platform.repository.equipment.EquipmentRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class EquipmentDocumentService {
    private final EquipmentDocumentRepo docRepo;
    private final EquipmentRepo equipmentRepo;

    private static final Set<String> VALID_TYPES = Set.of(
            "MANUAL", "DATASHEET", "SPEC_SHEET", "CERTIFICATE", "OTHER");

    @Transactional
    public DocumentResponse create(Long equipmentId, DocumentRequest req) {
        Equipment equipment = equipmentRepo.findById(equipmentId)
                .orElseThrow(() -> new RuntimeException("Equipment not found: " + equipmentId));
        if (!VALID_TYPES.contains(req.getDocType())) {
            throw new IllegalArgumentException("Invalid docType. Valid: " + VALID_TYPES);
        }
        EquipmentDocument doc = EquipmentDocument.builder()
                .equipment(equipment)
                .docName(req.getDocName())
                .docUrl(req.getDocUrl())
                .docType(req.getDocType())
                .build();
        return DocumentResponse.from(docRepo.save(doc));
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> findByEquipment(Long equipmentId) {
        return docRepo.findByEquipmentId(equipmentId).stream().map(DocumentResponse::from).toList();
    }

    @Transactional
    public void delete(Long documentId) {
        if (!docRepo.existsById(documentId)) {
            throw new RuntimeException("Document not found: " + documentId);
        }
        docRepo.deleteById(documentId);
    }
}