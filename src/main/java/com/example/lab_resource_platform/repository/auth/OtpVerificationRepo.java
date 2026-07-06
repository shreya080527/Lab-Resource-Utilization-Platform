package com.example.lab_resource_platform.repository.auth;

import com.example.lab_resource_platform.entity.auth.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface OtpVerificationRepo extends JpaRepository<OtpVerification,Long> {
    Optional<OtpVerification> findByEmailAndOtpAndVerifiedFalse(String email, String otp);
    Optional<OtpVerification> findTopByEmailOrderByGeneratedTimeDesc(String email);

    void deleteByExpiryTimeBefore(LocalDateTime expiryTime);

}
