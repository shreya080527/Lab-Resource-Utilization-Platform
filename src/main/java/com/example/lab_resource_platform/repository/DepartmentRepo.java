package com.example.lab_resource_platform.repository;

import com.example.lab_resource_platform.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DepartmentRepo extends JpaRepository<Department, Long> {
    boolean existsByNameAndInstitutionId(String name, Long institutionId);
    List<Department> findByInstitutionId(Long institutionId);
}