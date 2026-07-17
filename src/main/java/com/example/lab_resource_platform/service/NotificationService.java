package com.example.lab_resource_platform.service;

import com.example.lab_resource_platform.dto.NotificationResponse;
import com.example.lab_resource_platform.entity.Notification;
import com.example.lab_resource_platform.entity.user.User;
import com.example.lab_resource_platform.repository.NotificationRepo;
import com.example.lab_resource_platform.repository.auth.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepo notificationRepo;
    private final UserRepo userRepo;

    @Transactional
    public void createNotification(Long userId, String title, String message, 
            Notification.NotificationType type, Long referenceId, String referenceType, Long equipmentId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        
        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .relatedEquipmentId(equipmentId)
                .isRead(false)
                .build();
        
        notificationRepo.save(notification);
    }

    @Transactional
    public void notifyBookingApproved(Long userId, String equipmentName, Long bookingId) {
        String title = "Booking Approved";
        String message = "Your booking for " + equipmentName + " has been approved.";
        createNotification(userId, title, message, 
                Notification.NotificationType.BOOKING_APPROVED, bookingId, "BOOKING", null);
    }

    @Transactional
    public void notifyBookingRejected(Long userId, String equipmentName, Long bookingId) {
        String title = "Booking Rejected";
        String message = "Your booking request for " + equipmentName + " has been rejected.";
        createNotification(userId, title, message, 
                Notification.NotificationType.BOOKING_REJECTED, bookingId, "BOOKING", null);
    }

    @Transactional
    public void notifyWaitlistPromoted(Long userId, String equipmentName, Long bookingId, Long equipmentId) {
        String title = "You're Off the Waitlist!";
        String message = "A slot has opened up for " + equipmentName + ". Your booking is now pending approval.";
        createNotification(userId, title, message, 
                Notification.NotificationType.WAITLIST_PROMOTED, bookingId, "BOOKING", equipmentId);
    }

    @Transactional
    public void notifyNewBookingRequest(Long managerUserId, String researcherName, 
            String equipmentName, Long bookingId, Long equipmentId) {
        String title = "New Booking Request";
        String message = researcherName + " has requested to book " + equipmentName + ".";
        createNotification(managerUserId, title, message, 
                Notification.NotificationType.NEW_BOOKING_REQUEST, bookingId, "BOOKING", equipmentId);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getUserNotifications(Long userId) {
        return notificationRepo.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getUnreadNotifications(Long userId) {
        return notificationRepo.findByUserIdAndIsReadOrderByCreatedAtDesc(userId, false)
                .stream()
                .map(NotificationResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepo.countByUserIdAndIsRead(userId, false);
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        notificationRepo.markAsRead(notificationId, userId);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepo.markAllAsRead(userId);
    }
}
