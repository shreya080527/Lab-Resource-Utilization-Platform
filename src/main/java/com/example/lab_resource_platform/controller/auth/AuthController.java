package com.example.lab_resource_platform.controller.auth;

import com.example.lab_resource_platform.dto.auth.GetUserDetailsResponse;
import com.example.lab_resource_platform.dto.auth.LoginRequest;
import com.example.lab_resource_platform.dto.auth.ResetRequest;
import com.example.lab_resource_platform.dto.auth.ResetRequestEmail;
import com.example.lab_resource_platform.entity.user.User;
import com.example.lab_resource_platform.service.jwt.JwtService;
import com.example.lab_resource_platform.service.user.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService service;

    @Autowired
    AuthenticationManager authenticationmanager;

    @Autowired
    private JwtService jwtService;


    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody User user) {
        try {
            User registeredUser = service.registerUser(user);
            return ResponseEntity.ok(Map.of(
                    "message", "Registration successful! Please check your email for OTP.",
                    "email", registeredUser.getEmail()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("otp");

        boolean isVerified = service.verifyUserEmail(email, otp);

        if (isVerified) {
            return ResponseEntity.ok(Map.of("message", "Email verified successfully!"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired OTP"));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request){
        Authentication authentication = authenticationmanager
                .authenticate(new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        if(authentication.isAuthenticated()){
            User user = service.findByEmail(request.getEmail());
            String accessToken = jwtService.generateAccessToken(user.getEmail(), user.getRole());


            return ResponseEntity.ok(Map.of(
                    "accessToken", accessToken,
                    "tokenType", "Bearer"
            ));
        }else{
            return ResponseEntity.badRequest().body(Map.of("error", "Login Failed"));
        }

    }

    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@Valid @RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            service.resendOtp(email);

            return ResponseEntity.ok(Map.of("message", "OTP resent successfully!"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/reset-password-request")
    public ResponseEntity<?> resetPasswordRequest(@Valid @RequestBody ResetRequestEmail request){
        try {
            String email = request.getEmail();
            service.resetRequest(email);
            return ResponseEntity.ok("Reset OTP sent successfully!");
        }catch(RuntimeException e){
            return ResponseEntity.badRequest().body("Error " + e.getMessage());
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetRequest request){
        try {
            String email = request.getEmail();
            String otp = request.getOtp();
            boolean isVerified = service.verifyResetOtp(email, otp);
            if (!isVerified) {
                return ResponseEntity.badRequest().body("Error ");
            }
            String password = request.getNewPassword();
            service.changePassword(email,password);
            return ResponseEntity.ok("Password changed successfully!");

        }catch(RuntimeException e) {
            return ResponseEntity.badRequest().body("Error " + e.getMessage());
        }

    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Token is required"));
        }

        String token = authHeader.substring(7);
        String username = jwtService.extractUserName(token);

        User user = service.findByUsername(username);

        return ResponseEntity.ok(Map.of("message", "Logout successful!"));
    }

    @GetMapping("/get-user-details")
    public ResponseEntity<?> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName(); // this returns getUsername() from UserPrincipal

        User user = service.findByEmail(email);

        GetUserDetailsResponse response = new GetUserDetailsResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                user.getEmailVerified(),
                user.getDepartment(),
                user.getInstitution()
        );

        return ResponseEntity.ok(response);
    }
}
