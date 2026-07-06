package com.example.lab_resource_platform.repository.auth;

import com.example.lab_resource_platform.entity.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepo extends JpaRepository<User,Long> {

    User findByUsername(String username);
    Optional<User> findByEmail(String email);



    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
}
