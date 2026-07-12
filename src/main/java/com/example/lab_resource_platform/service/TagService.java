package com.example.lab_resource_platform.service;

import com.example.lab_resource_platform.dto.TagRequest;
import com.example.lab_resource_platform.dto.TagResponse;
import com.example.lab_resource_platform.entity.Tag;
import com.example.lab_resource_platform.entity.equipment.Equipment;
import com.example.lab_resource_platform.repository.TagRepo;
import com.example.lab_resource_platform.repository.equipment.EquipmentRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TagService {
    private final TagRepo tagRepo;
    private final EquipmentRepo equipmentRepo;

    @Transactional
    public List<TagResponse> addTags(Long equipmentId, TagRequest req) {
        Equipment equipment = equipmentRepo.findById(equipmentId)
                .orElseThrow(() -> new RuntimeException("Equipment not found: " + equipmentId));

        for (String name : req.getTagNames()) {
            String normalized = name.trim().toLowerCase();
            Tag tag = tagRepo.findByNameIgnoreCase(normalized)
                    .orElseGet(() -> tagRepo.save(Tag.builder().name(normalized).build()));
            equipment.getTags().add(tag);
        }
        equipmentRepo.save(equipment);
        return equipment.getTags().stream().map(TagResponse::from).toList();
    }

    @Transactional
    public void removeTag(Long equipmentId, Long tagId) {
        Equipment equipment = equipmentRepo.findById(equipmentId)
                .orElseThrow(() -> new RuntimeException("Equipment not found: " + equipmentId));
        equipment.getTags().removeIf(t -> t.getId().equals(tagId));
        equipmentRepo.save(equipment);
    }

    @Transactional(readOnly = true)
    public List<TagResponse> findAll() {
        return tagRepo.findAll().stream().map(TagResponse::from).toList();
    }
}