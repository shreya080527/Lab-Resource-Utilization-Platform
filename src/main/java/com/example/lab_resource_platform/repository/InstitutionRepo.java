package com.example.lab_resource_platform.repository;

import com.example.lab_resource_platform.entity.Institution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface InstitutionRepo extends JpaRepository<Institution, Long> {
    boolean existsByName(String name);
    Optional<Institution> findByName(String name);
    Optional<Institution> findByCode(String code);
}
