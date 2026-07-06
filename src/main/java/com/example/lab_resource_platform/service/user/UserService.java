package com.example.lab_resource_platform.service.user;

import com.example.lab_resource_platform.entity.user.User;
import com.example.lab_resource_platform.repository.auth.UserRepo;
import com.example.lab_resource_platform.service.otp.OtpService;
import jakarta.transaction.Transactional;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepo repo;

    @Autowired
    private OtpService otpService;


    private BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);


    @Transactional
    public User registerUser(User user) {

        // Check if email already exists and if its verified
        if (repo.existsByEmail(user.getEmail()) ) {
            User dbUser = repo.findByEmail(user.getEmail()).orElseThrow(()-> new RuntimeException("User not found"));
            if(dbUser.getEmailVerified()){
                throw new RuntimeException("Email already registered");
            }

        }

        // Check if username already exists
        if (repo.existsByUsername(user.getUsername())) {
            throw new RuntimeException("Username already taken");
        }

        // Encode password
        user.setPassword(encoder.encode(user.getPassword()));
        user.setEmailVerified(false);

        // Save user
        User savedUser = repo.save(user);


        // Generate and send OTP
        otpService.generateAndSendOtp(savedUser);

        return savedUser;
    }

    @Transactional
    public void changePassword(String email, String password){

        User user = repo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPassword(encoder.encode(password));
        repo.save(user);

    }


    public boolean verifyUserEmail(String email, String otp) {
        boolean isValid = otpService.verifyOtp(email, otp);

        if (isValid) {
            User user = repo.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            user.setEmailVerified(true);
            repo.save(user);
        }

        return isValid;
    }

    public boolean userLogin(String username, String password){
        User user = repo.findByUsername(username);
        if(user == null){
            return false;
        }

        if(!user.getEmailVerified()){
            throw new RuntimeException("Email is not verified, please verify.");
        }

        // Verify password using BCrypt
        return encoder.matches(password, user.getPassword());

    }

    // Resend OTP
    public void resendOtp(String email) {
        // Find the user
        User user = repo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Generate and send new OTP
        otpService.generateAndSendOtp(user);
    }

    public void resetRequest(String email){
        Optional<User> userOpt = repo.findByEmail(email);
        if (userOpt.isEmpty()) {
            return;
        }
        User user = userOpt.get();
        otpService.generateAndSendResetOtp(user);
    }

    public boolean verifyResetOtp(String email, String otp){
        return otpService.verifyResetOtp(email, otp);
    }

    public User findByUsername(String username) {
        User user = repo.findByUsername(username);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        return user;
    }

    public User findByUserId(Long userId) {
        User user = repo.findById(userId).
                orElseThrow(() -> new RuntimeException("User Not found"));

        return user;
    }

    public User findByEmail(@NotBlank(message = "User name required") String email) {
        User user = repo.findByEmail(email)
                .orElseThrow(()-> new RuntimeException("User Not Found"));
        return user;
    }
}
