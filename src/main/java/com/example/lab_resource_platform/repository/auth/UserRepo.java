package com.example.lab_resource_platform.repository.auth;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.lab_resource_platform.entity.user.Role;
import com.example.lab_resource_platform.entity.user.User;

@Repository
public interface UserRepo extends JpaRepository<User,Long> {

    User findByUsername(String username);
    Optional<User> findByEmail(String email);



    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    
    @Query("""
    	    SELECT u.email
    	    FROM User u
    	    WHERE u.role = :role
    	      AND u.department = (
    	          SELECT u2.department
    	          FROM User u2
    	          WHERE u2.id = :userId
    	      )
    	""")
    	List<String> findEmailsByRoleAndUserDepartment(
    	        @Param("role") Role role,
    	        @Param("userId") Long userId);
}

