package com.example.lab_resource_platform.repository;

import com.example.lab_resource_platform.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}