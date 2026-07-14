package com.example.lab_resource_platform.service.email;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;


    @Value("${app.email.from}")
    private String adminEmail;

    public void sendOtpEmail(String toEmail, String otp){
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(adminEmail);
        message.setTo(toEmail);
        message.setSubject("Lab Resource Utilization - Email Verification");
        message.setText("Your OTP for email verification is: " + otp +
                "\n\nThis OTP will expire in 5 minutes." +
                "\n\nIf you didn't request this, please ignore.");

        mailSender.send(message);

    }

    public void sendResetOtpEmail(String toEmail, String otp){
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(adminEmail);
        message.setTo(toEmail);
        message.setSubject("Lab Resource Utilization  - Reset Password");
        message.setText("Your OTP for Password Reset is: "+ otp +
                "\n\nThis OTP will expire in 5 minutes." +
                "\n\nIf you didn't request this, please ignore.");
        mailSender.send(message);
    }

    public void sendBookingNotificationEmail(String managerEmail, String researcherName, String equipmentName, String startTime, String endTime) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(adminEmail);
        message.setTo(managerEmail);
        message.setSubject("Lab Resource Utilization - New Pending Booking Request");
        message.setText("Hello Lab Manager,\n\n" +
                "A new equipment booking request has been submitted and requires your review.\n\n" +
                "Details:\n" +
                "• Researcher: " + researcherName + "\n" +
                "• Equipment: " + equipmentName + "\n" +
                "• Start Time: " + startTime + "\n" +
                "• End Time: " + endTime + "\n\n" +
                "Please log in to the system dashboard to approve or reject this pending request.");

        mailSender.send(message);
    }

    public void sendBookingAcceptedEmail(String toEmail, String researcherName, String equipmentName, String startTime, String endTime) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(adminEmail);
        message.setTo(toEmail);
        message.setSubject("Lab Resource Utilization - Booking APPROVED");
        message.setText("Hello " + researcherName + ",\n\n" +
                "Great news! Your equipment booking request has been approved by the Lab Manager.\n\n" +
                "Booking Details:\n" +
                "• Equipment: " + equipmentName + "\n" +
                "• Start Time: " + startTime + "\n" +
                "• End Time: " + endTime + "\n\n" +
                "Please ensure you follow standard laboratory safety guidelines during your session.");

        mailSender.send(message);
    }
    
    public void sendBookingRejectedEmail(String toEmail, String researcherName, String equipmentName, String startTime, String endTime) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(adminEmail);
        message.setTo(toEmail);
        message.setSubject("Lab Resource Utilization - Booking REJECTED");
        message.setText("Hello " + researcherName + ",\n\n" +
                "We regret to inform you that your equipment booking request has been rejected by the Lab Manager.\n\n" +
                "Requested Details:\n" +
                "• Equipment: " + equipmentName + "\n" +
                "• Start Time: " + startTime + "\n" +
                "• End Time: " + endTime + "\n\n" +
                "If you require assistance or want to request an alternative timeline, please contact your department lab manager.");

        mailSender.send(message);
    }
    
    public void sendBookingExpirationWarningEmail(String toEmail, String researcherName, String equipmentName, String endTime) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(adminEmail);
        message.setTo(toEmail);
        message.setSubject("Lab Resource Utilization - Reservation Expiring Tomorrow");
        message.setText("Hello " + researcherName + ",\n\n" +
                "This is a friendly reminder that your reservation for the following asset is scheduled to conclude tomorrow.\n\n" +
                "Details:\n" +
                "• Equipment: " + equipmentName + "\n" +
                "• Expiration/End Time: " + endTime + "\n\n" +
                "Please plan your sessions accordingly and clean up the workspace before leaving so the next researcher can begin on time.");

        mailSender.send(message);
    }
}
