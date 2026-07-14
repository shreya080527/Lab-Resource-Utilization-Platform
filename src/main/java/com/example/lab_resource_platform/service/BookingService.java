package com.example.lab_resource_platform.service;


import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.lab_resource_platform.dto.BookingResponse;
import com.example.lab_resource_platform.dto.EquipmentUtilizationDTO;
import com.example.lab_resource_platform.dto.RecurringBookingRequest;
import com.example.lab_resource_platform.dto.RecurringBookingResponse;
import com.example.lab_resource_platform.dto.ResearcherDashboardDto;
import com.example.lab_resource_platform.dto.WaitlistResponse;
import com.example.lab_resource_platform.entity.BookingAudit;
import com.example.lab_resource_platform.entity.Waitlist;
import com.example.lab_resource_platform.entity.Bookings.Booking;
import com.example.lab_resource_platform.entity.Bookings.BookingStatus;
import com.example.lab_resource_platform.entity.equipment.Equipment;
import com.example.lab_resource_platform.entity.equipment.EquipmentStatus;
import com.example.lab_resource_platform.entity.user.Role;
import com.example.lab_resource_platform.entity.user.User;
import com.example.lab_resource_platform.entity.user.UserPrincipal;
import com.example.lab_resource_platform.repository.BookingAuditRepo;
import com.example.lab_resource_platform.repository.BookingRepository;
import com.example.lab_resource_platform.repository.WaitlistRepository;
import com.example.lab_resource_platform.repository.auth.UserRepo;
import com.example.lab_resource_platform.repository.equipment.EquipmentRepo;
import com.example.lab_resource_platform.service.email.EmailService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BookingService {
    private final BookingRepository bookingRepo;
    private final WaitlistRepository waitlistRepo;
    private final EquipmentRepo equipmentRepo;
    private final UserRepo userRepo;
    private final BookingAuditRepo auditRepo;
    private final EmailService emailService;

    private final List<BookingStatus> activeStatuses = List.of(BookingStatus.PENDING, BookingStatus.CONFIRMED);
    private final List<BookingStatus> utilizationStatuses = List.of(
            BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED);

    // ─────────── CREATE ───────────
    
    @Transactional
    public Booking createBooking(Long userId, Long equipmentId, LocalDateTime start, LocalDateTime end) {
        User user = userRepo.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        Equipment equipment = equipmentRepo.findById(equipmentId)
                .orElseThrow(() -> new RuntimeException("Equipment not found"));

        if (bookingRepo.existsByEquipmentIdAndUserIdAndStatusIn(equipmentId, userId, activeStatuses)) {
            throw new IllegalStateException("You already have an active or pending booking for this equipment.");
        }

        if (bookingRepo.existsOverlappingActiveBookingsForUpdate(equipmentId, start, end, activeStatuses)) {
            addToWaitlist(user, equipment, start, end);
            return null;  // ← transaction commits normally → waitlist entry is saved
        }

        Booking booking = Booking.builder()
                .user(user).equipment(equipment)
                .startTime(start).endTime(end)
                .status(BookingStatus.PENDING)
                .build();
        booking = bookingRepo.save(booking);
        
        //send email to manager
        List<String> managerEmails = userRepo.findEmailsByRoleAndUserDepartment(
                Role.LAB_MANAGER,
                user.getId()
        );

        if (managerEmails.isEmpty()) {
            throw new IllegalStateException("No lab manager found for the user's department.");
        }      
        try {
               if (!managerEmails.isEmpty()) {
                 emailService.sendBookingNotificationEmail(
                        managerEmails.get(0),
                        user.getUsername(),
                        equipment.getEquipmentName(),
                        start.toString(),
                        end.toString()
                );
            }
        } catch (Exception e) {
        	throw new IllegalStateException("Failed to send notification email to the lab manager.");
        }
        writeAudit(booking, "CREATED", null, "PENDING", getCurrentUser(), null);
        return booking;
    }

    @Transactional
    public RecurringBookingResponse createRecurring(RecurringBookingRequest req) {
        User user = userRepo.findById(req.getUserId()).orElseThrow(() -> new RuntimeException("User not found"));
        Equipment equipment = equipmentRepo.findById(req.getEquipmentId())
                .orElseThrow(() -> new RuntimeException("Equipment not found"));
        User performer = getCurrentUser();

        // Create parent booking
        Booking parent = Booking.builder()
                .user(user).equipment(equipment)
                .startTime(req.getStartTime()).endTime(req.getEndTime())
                .status(BookingStatus.PENDING)
                .recurrencePattern(req.getRecurrencePattern())
                .build();
        parent = bookingRepo.save(parent);
        writeAudit(parent, "CREATED", null, "PENDING", performer, "Recurring parent booking");

        List<Booking> children = new ArrayList<>();
        List<RecurringBookingResponse.WaitlistSlot> waitlisted = new ArrayList<>();

        LocalDateTime nextStart = req.getStartTime();
        LocalDateTime nextEnd = req.getEndTime();
        for (int i = 1; i <= req.getRecurrenceCount(); i++) {
            nextStart = advanceByPattern(nextStart, req.getRecurrencePattern());
            nextEnd = advanceByPattern(nextEnd, req.getRecurrencePattern());

            if (bookingRepo.existsOverlappingActiveBookingsForUpdate(req.getEquipmentId(), nextStart, nextEnd, activeStatuses)) {
                Waitlist w = addToWaitlist(user, equipment, nextStart, nextEnd);
                waitlisted.add(new RecurringBookingResponse.WaitlistSlot(nextStart, nextEnd, "Conflict — added to waitlist"));
            } else {
                Booking child = Booking.builder()
                        .user(user).equipment(equipment)
                        .startTime(nextStart).endTime(nextEnd)
                        .status(BookingStatus.PENDING)
                        .recurrencePattern(req.getRecurrencePattern())
                        .parentBooking(parent)
                        .build();
                child = bookingRepo.save(child);
                writeAudit(child, "RECURRENCE_GENERATED", null, "PENDING", performer, "Child of booking #" + parent.getId());
                children.add(child);
            }
        }
        List<BookingResponse> bookingResponses = children.stream().map(BookingResponse::from).toList();
        return new RecurringBookingResponse(parent.getId(), bookingResponses.size(), waitlisted.size(), bookingResponses, waitlisted);    }

    private LocalDateTime advanceByPattern(LocalDateTime dt, String pattern) {
        return switch (pattern.toUpperCase()) {
            case "DAILY" -> dt.plusDays(1);
            case "WEEKLY" -> dt.plusWeeks(1);
            case "MONTHLY" -> dt.plusMonths(1);
            default -> throw new IllegalArgumentException("Unknown recurrence pattern: " + pattern);
        };
    }
    
    //Send Expiring booking email notifications
    @Scheduled(cron = "0 45 22 * * ?") // Runs automatically every day at 8:00 AM
	 @Transactional(readOnly = true)
	 public void sendExpirationReminders() {
	     LocalDateTime tomorrowStart = LocalDateTime.now().plusDays(1).toLocalDate().atStartOfDay();
	     LocalDateTime tomorrowEnd = tomorrowStart.plusDays(1).minusNanos(1);
	
	     // Fetch all confirmed active reservations that will close within tomorrow's 24-hour block
	     List<Booking> expiringBookings = bookingRepo.findByStatusAndEndTimeBetween(
	             BookingStatus.CONFIRMED, tomorrowStart, tomorrowEnd);
	
	     for (Booking b : expiringBookings) {
	         try {
	             emailService.sendBookingExpirationWarningEmail(
	                 b.getUser().getEmail(),
	                 b.getUser().getUsername(),
	                 b.getEquipment().getEquipmentName(),
	                 b.getEndTime().toString()
	             );
	         } catch (Exception e) {
	             System.err.println("Failed to send expiration email for booking ID " + b.getId() + ": " + e.getMessage());
	         }
	     }
	 }

    // ─────────── LIFECYCLE ───────────

    @Transactional
    public Booking accept(Long bookingId) {
        Booking b = findBooking(bookingId);
        if (b.getStatus() != BookingStatus.PENDING) {
			throw new IllegalStateException("Cannot accept — booking not PENDING. Current: " + b.getStatus());
		}
        BookingStatus old = b.getStatus();
        b.setStatus(BookingStatus.CONFIRMED);
        b.setUpdatedBy(getCurrentUser());
        b = bookingRepo.save(b);
        
      //Send Accept Email Notification
        try {
            emailService.sendBookingAcceptedEmail(
                b.getUser().getEmail(),
                b.getUser().getUsername(),
                b.getEquipment().getEquipmentName(),
                b.getStartTime().toString(),
                b.getEndTime().toString()
            );
        } catch (Exception e) {
        	throw new IllegalStateException("Failed to dispatch acceptance notification mail.");
            
        }
        
        writeAudit(b, "ACCEPTED", old.name(), "CONFIRMED", getCurrentUser(), "Approved by manager");
        return b;
    }

    @Transactional
    public Booking reject(Long bookingId) {
        Booking b = findBooking(bookingId);
        if (b.getStatus() != BookingStatus.PENDING) {
			throw new IllegalStateException("Cannot reject — booking not PENDING. Current: " + b.getStatus());
		}
        BookingStatus old = b.getStatus();
        b.setStatus(BookingStatus.REJECTED);
        b.setUpdatedBy(getCurrentUser());
        b = bookingRepo.save(b);
        
        //Send Rejection Email Notification
        try {
            emailService.sendBookingRejectedEmail(
                b.getUser().getEmail(),
                b.getUser().getUsername(),
                b.getEquipment().getEquipmentName(),
                b.getStartTime().toString(),
                b.getEndTime().toString()
            );
        } catch (Exception e) {
        	throw new IllegalStateException("Failed to dispatch rejection notification mail.");          
        }
        writeAudit(b, "REJECTED", old.name(), "REJECTED", getCurrentUser(), null);
        promoteNextEligibleWaitlist(b.getEquipment().getId());
        return b;
    }

    @Transactional
    public Booking cancel(Long bookingId) {
        Booking b = findBooking(bookingId);
        if (b.getStatus() != BookingStatus.PENDING && b.getStatus() != BookingStatus.CONFIRMED) {
			throw new IllegalStateException("Cannot cancel — booking not PENDING/CONFIRMED. Current: " + b.getStatus());
		}
        BookingStatus old = b.getStatus();
        b.setStatus(BookingStatus.CANCELLED);
        b.setUpdatedBy(getCurrentUser());
        b = bookingRepo.save(b);
        writeAudit(b, "CANCELLED", old.name(), "CANCELLED", getCurrentUser(), null);
        promoteNextEligibleWaitlist(b.getEquipment().getId());
        return b;
    }

    @Transactional
    public Booking start(Long bookingId) {
        Booking b = findBooking(bookingId);
        if (b.getStatus() != BookingStatus.CONFIRMED) {
			throw new IllegalStateException("Cannot start — booking not CONFIRMED. Current: " + b.getStatus());
		}
        BookingStatus old = b.getStatus();
        b.setStatus(BookingStatus.IN_PROGRESS);
        b.setUpdatedBy(getCurrentUser());
        b = bookingRepo.save(b);
        writeAudit(b, "STARTED", old.name(), "IN_PROGRESS", getCurrentUser(), null);
        return b;
    }

    @Transactional
    public Booking complete(Long bookingId) {
        Booking b = findBooking(bookingId);
        if (b.getStatus() != BookingStatus.IN_PROGRESS) {
			throw new IllegalStateException("Cannot complete — booking not IN_PROGRESS. Current: " + b.getStatus());
		}
        BookingStatus old = b.getStatus();
        b.setStatus(BookingStatus.COMPLETED);
        b.setUpdatedBy(getCurrentUser());
        b = bookingRepo.save(b);
        writeAudit(b, "COMPLETED", old.name(), "COMPLETED", getCurrentUser(), null);
        promoteNextEligibleWaitlist(b.getEquipment().getId());
        return b;
    }

    @Transactional
    public Booking noShow(Long bookingId) {
        Booking b = findBooking(bookingId);
        if (b.getStatus() != BookingStatus.CONFIRMED) {
			throw new IllegalStateException("Cannot mark No-Show — booking must be CONFIRMED. Current: " + b.getStatus());
		}
        BookingStatus old = b.getStatus();
        b.setStatus(BookingStatus.NO_SHOW);
        b.setUpdatedBy(getCurrentUser());
        b = bookingRepo.save(b);
        writeAudit(b, "NO_SHOW", old.name(), "NO_SHOW", getCurrentUser(), "Marked as no-show by manager");
        promoteNextEligibleWaitlist(b.getEquipment().getId());
        return b;
    }

    // ─────────── WAITLIST ───────────

    @Transactional
    public Waitlist addToWaitlist(User user, Equipment equipment, LocalDateTime start, LocalDateTime end) {
        Integer maxPos = waitlistRepo.findMaxPositionForEquipment(equipment.getId());
        int nextPos = (maxPos == null ? 0 : maxPos) + 1;
        Waitlist w = Waitlist.builder()
                .user(user).equipment(equipment)
                .startTime(start).endTime(end)
                .position(nextPos)
                .build();
        return waitlistRepo.save(w);
    }

    @Transactional
    public void promoteNextEligibleWaitlist(Long equipmentId) {
        List<Waitlist> queue = waitlistRepo.findByEquipmentIdOrderByPositionAsc(equipmentId);
        for (Waitlist entry : queue) {
            boolean blocked = bookingRepo.existsOverlappingActiveBookingsForUpdate(
                    equipmentId, entry.getStartTime(), entry.getEndTime(), activeStatuses);
            if (!blocked) {
                Booking promoted = Booking.builder()
                        .user(entry.getUser()).equipment(entry.getEquipment())
                        .startTime(entry.getStartTime()).endTime(entry.getEndTime())
                        .status(BookingStatus.PENDING)
                        .build();
                promoted = bookingRepo.save(promoted);
                writeAudit(promoted, "CREATED", null, "PENDING", null,
                        "Auto-promoted from waitlist entry #" + entry.getId());
                waitlistRepo.delete(entry);
            }
        }
    }

    @Transactional
    public boolean manualPromote(Long equipmentId, Long waitlistId) {
        List<Waitlist> queue = waitlistRepo.findByEquipmentIdOrderByPositionAsc(equipmentId);
        Waitlist target = (waitlistId != null)
                ? queue.stream().filter(w -> w.getId().equals(waitlistId)).findFirst().orElse(null)
                : queue.isEmpty() ? null : queue.get(0);
        if (target == null) {
			return false;
		}

        boolean blocked = bookingRepo.existsOverlappingActiveBookingsForUpdate(
                equipmentId, target.getStartTime(), target.getEndTime(), activeStatuses);
        if (blocked) {
			throw new IllegalStateException("Cannot promote — target slot is still blocked");
		}

        Booking promoted = Booking.builder()
                .user(target.getUser()).equipment(target.getEquipment())
                .startTime(target.getStartTime()).endTime(target.getEndTime())
                .status(BookingStatus.PENDING)
                .build();
        promoted = bookingRepo.save(promoted);
        writeAudit(promoted, "CREATED", null, "PENDING", getCurrentUser(),
                "Manually promoted from waitlist entry #" + target.getId());
        waitlistRepo.delete(target);
        return true;
    }

    // ─────────── QUERIES ───────────

    @Transactional(readOnly = true)
    public List<Booking> findEquipmentCalendar(Long equipmentId, LocalDateTime start, LocalDateTime end) {
        return bookingRepo.findEquipmentCalendar(equipmentId, start, end);
    }

    @Transactional(readOnly = true)
    public List<Booking> findUserCalendar(Long userId, LocalDateTime start, LocalDateTime end) {
        return bookingRepo.findBookingsInCalendarRange(userId, start, end);
    }

    @Transactional(readOnly = true)
    public List<Booking> findAll() {
        return bookingRepo.findAll();
    }

    @Transactional(readOnly = true)
    public Booking findBooking(Long id) {
        return bookingRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + id));
    }

    @Transactional(readOnly = true)
    public List<BookingAudit> findBookingAudit(Long bookingId) {
        findBooking(bookingId);
        return auditRepo.findByBookingIdOrderByCreatedAtAsc(bookingId);
    }

    @Transactional(readOnly = true)
    public List<BookingAudit> findEquipmentAudit(Long equipmentId) {
        return auditRepo.findByEquipmentId(equipmentId);
    }

    @Transactional(readOnly = true)
    public List<Waitlist> findAllWaitlist() {
        return waitlistRepo.findAllByOrderByCreatedAtAsc();
    }

    @Transactional(readOnly = true)
    public List<Waitlist> findWaitlistForEquipment(Long equipmentId) {
        return waitlistRepo.findByEquipmentIdOrderByPositionAsc(equipmentId);
    }

    @Transactional
    public void removeWaitlistEntry(Long waitlistId) {
        if (!waitlistRepo.existsById(waitlistId)) {
			throw new RuntimeException("Waitlist entry not found: " + waitlistId);
		}
        waitlistRepo.deleteById(waitlistId);
    }

    // ─────────── UTILIZATION ───────────

    @Transactional(readOnly = true)
    public EquipmentUtilizationDTO calculateUtilization(Long equipmentId,
                                                        LocalDateTime periodStart, LocalDateTime periodEnd) {
        Equipment equipment = equipmentRepo.findById(equipmentId)
                .orElseThrow(() -> new RuntimeException("Equipment not found: " + equipmentId));
        List<Booking> bookings = bookingRepo.findBookingsForUtilization(
                equipmentId, periodStart, periodEnd, utilizationStatuses);

        double bookedHours = 0;
        for (Booking b : bookings) {
            LocalDateTime effStart = b.getStartTime().isAfter(periodStart) ? b.getStartTime() : periodStart;
            LocalDateTime effEnd = b.getEndTime().isBefore(periodEnd) ? b.getEndTime() : periodEnd;
            bookedHours += Duration.between(effStart, effEnd).toMinutes() / 60.0;
        }
        double availableHours = Duration.between(periodStart, periodEnd).toMinutes() / 60.0;
        double utilization = availableHours > 0 ? (bookedHours / availableHours) * 100 : 0;

        return new EquipmentUtilizationDTO(
                equipment.getId(), equipment.getEquipmentName(),
                bookedHours, availableHours, utilization);
    }

    private void writeAudit(Booking booking, String action, String from, String to, User performer, String notes) {
        BookingAudit audit = BookingAudit.builder()
                .booking(booking)
                .action(action)
                .fromStatus(from)
                .toStatus(to)
                .performedBy(performer)
                .notes(notes)
                .build();
        auditRepo.save(audit);
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal)) {
			return null;
		}
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        return userRepo.findByEmail(principal.getUsername()).orElse(null);
    }

    private void toggleEquipmentStatus(Equipment equipment, BookingStatus triggerStatus) {
        switch (triggerStatus) {
            case IN_PROGRESS -> {
                equipment.setStatus(EquipmentStatus.BOOKED);
                equipmentRepo.save(equipment);
            }
            case COMPLETED, CANCELLED, NO_SHOW, REJECTED -> {
                // Revert to AVAILABLE if no other IN_PROGRESS booking exists
                boolean stillInUse = bookingRepo.findByStatus(BookingStatus.IN_PROGRESS).stream()
                        .anyMatch(b -> b.getEquipment().getId().equals(equipment.getId()));
                if (!stillInUse && equipment.getStatus() == EquipmentStatus.BOOKED) {
                    equipment.setStatus(EquipmentStatus.AVAILABLE);
                    equipmentRepo.save(equipment);
                }
            }
            default -> {}
        }

    }
    @Transactional(readOnly = true)
    public ResearcherDashboardDto getResearcherDashboard(Long userId) {
        if (!userRepo.existsById(userId)) {
            throw new RuntimeException("User not found: " + userId);
        }
        List<BookingResponse> bookings = bookingRepo.findByUserIdOrderByStartTimeAsc(userId)
                .stream().map(BookingResponse::from).toList();
        List<WaitlistResponse> waitlist = waitlistRepo.findByUserId(userId)
                .stream().map(WaitlistResponse::from).toList();
        return new ResearcherDashboardDto(bookings, waitlist);
    }
}