package com.example.lab_resource_platform.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.lab_resource_platform.dto.CompleteMaintenanceRequest;
import com.example.lab_resource_platform.dto.CreateMaintenanceRequestRequest;
import com.example.lab_resource_platform.dto.MaintenanceRequestDto;
import com.example.lab_resource_platform.entity.MaintenanceRequest;
import com.example.lab_resource_platform.entity.MaintenanceRequestStatus;
import com.example.lab_resource_platform.entity.Notification;
import com.example.lab_resource_platform.entity.equipment.Equipment;
import com.example.lab_resource_platform.entity.equipment.EquipmentStatus;
import com.example.lab_resource_platform.entity.user.Role;
import com.example.lab_resource_platform.entity.user.User;
import com.example.lab_resource_platform.entity.user.UserPrincipal;
import com.example.lab_resource_platform.repository.MaintenanceRequestRepo;
import com.example.lab_resource_platform.repository.NotificationRepo;
import com.example.lab_resource_platform.repository.auth.UserRepo;
import com.example.lab_resource_platform.repository.equipment.EquipmentRepo;
import com.example.lab_resource_platform.service.email.EmailService;

import lombok.RequiredArgsConstructor;

/**
 * Business logic for maintenance requests.
 *
 * Lifecycle:
 *   create()    → status = REQUESTED, notify the technician
 *   start()     → status = IN_PROGRESS, equipment → UNDER_MAINTENANCE (only the assigned technician)
 *   complete()  → status = COMPLETED, equipment → AVAILABLE, notify the manager
 *   cancel()    → status = CANCELLED, equipment → prior status, notify the technician
 */
@Service
@RequiredArgsConstructor
public class MaintenanceService {

    private final MaintenanceRequestRepo maintenanceRepo;
    private final EquipmentRepo equipmentRepo;
    private final UserRepo userRepo;
    private final NotificationRepo notificationRepo;
    private final EmailService emailService;
    
    // ═══════════════════════════════════════════════════════════════
    // CREATE
    // ═══════════════════════════════════════════════════════════════

    @Transactional
    public MaintenanceRequestDto create(CreateMaintenanceRequestRequest req) {
        User manager = getCurrentUser();

        Equipment equipment = equipmentRepo.findById(req.getEquipmentId())
                .orElseThrow(() -> new RuntimeException("Equipment not found: " + req.getEquipmentId()));

        // Equipment must not be RETIRED
        if (equipment.getStatus() == EquipmentStatus.RETIRED) {
            throw new IllegalStateException("Cannot raise a maintenance request for retired equipment.");
        }

        // Equipment must not already have an active maintenance request
        List<MaintenanceRequest> active = maintenanceRepo.findActiveForEquipment(
                equipment.getId(),
                List.of(MaintenanceRequestStatus.REQUESTED, MaintenanceRequestStatus.IN_PROGRESS));
        if (!active.isEmpty()) {
            throw new IllegalStateException(
                    "Equipment already has an active maintenance request (#" + active.get(0).getId() + ").");
        }

        User technician = userRepo.findById(req.getAssignedToId())
                .orElseThrow(() -> new RuntimeException("Technician not found: " + req.getAssignedToId()));

        // The assigned user must be a LAB_TECHNICIAN
        if (technician.getRole() != Role.LAB_TECHNICIAN) {
            throw new IllegalArgumentException(
                    "Assigned user must have role LAB_TECHNICIAN. Got: " + technician.getRole());
        }

        MaintenanceRequest request = MaintenanceRequest.builder()
                .equipment(equipment)
                .requestedBy(manager)
                .assignedTo(technician)
                .status(MaintenanceRequestStatus.REQUESTED)
                .description(req.getDescription())
                .priority(req.getPriority())
                .build();
        request = maintenanceRepo.save(request);

        // Notify the technician
        sendNotification(technician, equipment, request,
                "New maintenance request #" + request.getId(),
                "You have been assigned a maintenance request for " +
                        equipment.getEquipmentName() + ": " + req.getDescription(),
                Notification.NotificationType.MAINTENANCE_DUE);
        
     // Email Notification to Assigned Technician
        try {
            if (technician.getEmail() != null && !technician.getEmail().isBlank()) {
                emailService.sendMaintenanceCreatedEmail(
                        technician.getEmail(),
                        equipment.getEquipmentName(),
                        req.getPriority() != null ? req.getPriority() : "STANDARD",
                        req.getDescription()
                );
            }
        } catch (Exception e) {
        	throw new IllegalStateException("Email sending failed with exception.");
        }
        
        return MaintenanceRequestDto.from(request);
    }

    // ═══════════════════════════════════════════════════════════════
    // START  (technician begins work → equipment → UNDER_MAINTENANCE)
    // ═══════════════════════════════════════════════════════════════

    @Transactional
    public MaintenanceRequestDto start(Long requestId) {
        User technician = getCurrentUser();
        MaintenanceRequest m = findById(requestId);

        if (m.getStatus() != MaintenanceRequestStatus.REQUESTED) {
            throw new IllegalStateException(
                    "Cannot start — request must be in REQUESTED state. Current: " + m.getStatus());
        }

        // Only the assigned technician can start
        if (!m.getAssignedTo().getId().equals(technician.getId())) {
            throw new IllegalStateException("Only the assigned technician can start this maintenance request.");
        }

        // Snapshot the equipment's current status so we can restore it on cancel
        m.setEquipmentStatusBeforeMaintenance(m.getEquipment().getStatus());

        m.setStatus(MaintenanceRequestStatus.IN_PROGRESS);
        m.setStartedAt(LocalDateTime.now());

        // Force the equipment to UNDER_MAINTENANCE
        m.getEquipment().setStatus(EquipmentStatus.UNDER_MAINTENANCE);
        equipmentRepo.save(m.getEquipment());

        m = maintenanceRepo.save(m);

        // Notify the manager that work has started
        sendNotification(m.getRequestedBy(), m.getEquipment(), m,
                "Maintenance started for #" + m.getId(),
                "Technician " + technician.getUsername() + " has started maintenance on " +
                        m.getEquipment().getEquipmentName() + ".",
                Notification.NotificationType.SYSTEM_ANNOUNCEMENT);
        
        // Notify Manager via email
        try {
            if (m.getRequestedBy() != null && m.getRequestedBy().getEmail() != null) {
                emailService.sendMaintenanceStartedEmail(
                        m.getRequestedBy().getEmail(),
                        m.getId(),
                        m.getEquipment().getEquipmentName(),
                        m.getAssignedTo().getUsername()
                );
            }
        } catch (Exception e) {
        	throw new IllegalStateException("Failed to send maintenance start email.");       
        }
        
        return MaintenanceRequestDto.from(m);
    }

    // ═══════════════════════════════════════════════════════════════
    // COMPLETE  (technician finishes → equipment → AVAILABLE)
    // ═══════════════════════════════════════════════════════════════

    @Transactional
    public MaintenanceRequestDto complete(Long requestId, CompleteMaintenanceRequest body) {
        User technician = getCurrentUser();
        MaintenanceRequest m = findById(requestId);

        if (m.getStatus() != MaintenanceRequestStatus.IN_PROGRESS) {
            throw new IllegalStateException(
                    "Cannot complete — request must be IN_PROGRESS. Current: " + m.getStatus());
        }

        if (!m.getAssignedTo().getId().equals(technician.getId())) {
            throw new IllegalStateException("Only the assigned technician can complete this maintenance request.");
        }

        m.setStatus(MaintenanceRequestStatus.COMPLETED);
        m.setCompletedAt(LocalDateTime.now());
        m.setCompletionNotes(body.getCompletionNotes());
        m.setResult(body.getResult());

        // Restore equipment to AVAILABLE — unless it was OUT_OF_SERVICE or RETIRED before
        EquipmentStatus prior = m.getEquipmentStatusBeforeMaintenance();
        if (prior != EquipmentStatus.OUT_OF_SERVICE && prior != EquipmentStatus.RETIRED) {
            m.getEquipment().setStatus(EquipmentStatus.AVAILABLE);
        } else {
            m.getEquipment().setStatus(prior);
        }
        equipmentRepo.save(m.getEquipment());

        m = maintenanceRepo.save(m);

        // Notify the manager
        sendNotification(m.getRequestedBy(), m.getEquipment(), m,
                "Maintenance completed for #" + m.getId(),
                "Technician " + technician.getUsername() + " completed maintenance on " +
                        m.getEquipment().getEquipmentName() + ". Result: " + body.getResult(),
                Notification.NotificationType.EQUIPMENT_AVAILABLE);
        
     // Notify Manager via email
        try {
            if (m.getRequestedBy() != null &&  m.getRequestedBy().getEmail() != null) {
                emailService.sendMaintenanceCompletedEmail(
                        m.getRequestedBy().getEmail(),
                        m.getId(),
                        m.getEquipment().getEquipmentName(),
                        m.getAssignedTo().getUsername(),
                        m.getResult(),
                        m.getCompletionNotes()
                );
            }
        } catch (Exception e) {
        	throw new IllegalStateException("Failed to send maintenance completion email.");
        }

        return MaintenanceRequestDto.from(m);
    }

    // ═══════════════════════════════════════════════════════════════
    // CANCEL  (manager cancels → equipment → prior status)
    // ═══════════════════════════════════════════════════════════════

    @Transactional
    public MaintenanceRequestDto cancel(Long requestId) {
        User manager = getCurrentUser();
        MaintenanceRequest m = findById(requestId);

        if (m.getStatus() == MaintenanceRequestStatus.COMPLETED ||
            m.getStatus() == MaintenanceRequestStatus.CANCELLED) {
            throw new IllegalStateException("Cannot cancel a " + m.getStatus() + " request.");
        }

        // Only the manager who raised it (or an admin) can cancel
        if (!m.getRequestedBy().getId().equals(manager.getId()) &&
            manager.getRole() != Role.SYSTEM_ADMIN) {
            throw new IllegalStateException("Only the requesting manager (or a System Admin) can cancel this request.");
        }

        m.setStatus(MaintenanceRequestStatus.CANCELLED);

        // Restore the equipment's prior status (if maintenance had started)
        if (m.getEquipmentStatusBeforeMaintenance() != null) {
            m.getEquipment().setStatus(m.getEquipmentStatusBeforeMaintenance());
            equipmentRepo.save(m.getEquipment());
        }

        m = maintenanceRepo.save(m);

        // Notify the technician
        sendNotification(m.getAssignedTo(), m.getEquipment(), m,
                "Maintenance request #" + m.getId() + " cancelled",
                "The maintenance request for " + m.getEquipment().getEquipmentName() +
                        " has been cancelled by " + manager.getUsername() + ".",
                Notification.NotificationType.SYSTEM_ANNOUNCEMENT);
        
        // Notify Assigned Technician via email
        try {
            if (m.getAssignedTo() != null && m.getAssignedTo().getEmail() != null) {
                emailService.sendMaintenanceCancelledEmail(
                        m.getAssignedTo().getEmail(),
                        m.getId(),
                        m.getEquipment().getEquipmentName(),
                        m.getStatus().name()
                );
            }
        } catch (Exception e) {
        	throw new IllegalStateException("Failed to send maintenance cancellation email.");       
        }
        return MaintenanceRequestDto.from(m);
    }

    // ═══════════════════════════════════════════════════════════════
    // QUERIES
    // ═══════════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public MaintenanceRequest findById(Long id) {
        return maintenanceRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Maintenance request not found: " + id));
    }

    @Transactional(readOnly = true)
    public MaintenanceRequestDto getById(Long id) {
        return MaintenanceRequestDto.from(findById(id));
    }

    /** All requests — for LAB_MANAGER / admin dashboards. */
    @Transactional(readOnly = true)
    public List<MaintenanceRequestDto> findAll() {
        return maintenanceRepo.findAllByOrderByCreatedAtDesc()
                .stream().map(MaintenanceRequestDto::from).toList();
    }

    /** Requests assigned to the current technician. */
    @Transactional(readOnly = true)
    public List<MaintenanceRequestDto> findMyAssigned() {
        User technician = getCurrentUser();
        return maintenanceRepo.findByAssignedToIdOrderByCreatedAtDesc(technician.getId())
                .stream().map(MaintenanceRequestDto::from).toList();
    }

    /** Requests raised by the current manager. */
    @Transactional(readOnly = true)
    public List<MaintenanceRequestDto> findMyRequested() {
        User manager = getCurrentUser();
        return maintenanceRepo.findByRequestedByIdOrderByCreatedAtDesc(manager.getId())
                .stream().map(MaintenanceRequestDto::from).toList();
    }

    /** Requests for a specific equipment. */
    @Transactional(readOnly = true)
    public List<MaintenanceRequestDto> findByEquipment(Long equipmentId) {
        return maintenanceRepo.findByEquipmentIdOrderByCreatedAtDesc(equipmentId)
                .stream().map(MaintenanceRequestDto::from).toList();
    }

    /** Count of active (REQUESTED + IN_PROGRESS) requests assigned to the current technician. */
    @Transactional(readOnly = true)
    public long countMyActiveAssigned() {
        User technician = getCurrentUser();
        return maintenanceRepo.countByAssignedToIdAndStatusIn(
                technician.getId(),
                List.of(MaintenanceRequestStatus.REQUESTED, MaintenanceRequestStatus.IN_PROGRESS));
    }

    // ═══════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════

    private void sendNotification(User recipient, Equipment equipment,
                                  MaintenanceRequest request,
                                  String title, String message,
                                  Notification.NotificationType type) {
        Notification n = new Notification();
        n.setUser(recipient);
        n.setTitle(title);
        n.setMessage(message);
        n.setType(type);
        n.setIsRead(false);
        n.setReferenceId(request.getId());
        n.setReferenceType("MAINTENANCE_REQUEST");
        n.setRelatedEquipmentId(equipment.getId());
        notificationRepo.save(n);
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal)) {
            throw new RuntimeException("Not authenticated");
        }
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        return userRepo.findByEmail(principal.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
