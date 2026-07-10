package com.example.lab_resource_platform.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.lab_resource_platform.dto.EquipmentUtilizationDTO;
import com.example.lab_resource_platform.dto.ResearcherDashboardDto;
import com.example.lab_resource_platform.entity.Waitlist;
import com.example.lab_resource_platform.entity.Bookings.Booking;
import com.example.lab_resource_platform.entity.Bookings.BookingStatus;
import com.example.lab_resource_platform.entity.equipment.Equipment;
import com.example.lab_resource_platform.entity.user.Role;
import com.example.lab_resource_platform.entity.user.User;
import com.example.lab_resource_platform.repository.BookingRepository;
import com.example.lab_resource_platform.repository.WaitlistRepository;
import com.example.lab_resource_platform.repository.auth.UserRepo;
import com.example.lab_resource_platform.repository.equipment.EquipmentRepo;

import java.time.Duration;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final WaitlistRepository waitlistRepository;
    private final UserRepo userRepository; 
    private final EquipmentRepo equipmentRepository;

    // Both Pending and Confirmed slots represent an unavailable block for new applicants
    private final List<BookingStatus> activeStatuses = List.of(BookingStatus.PENDING, BookingStatus.CONFIRMED);

    @Transactional
    public String createBooking(Long userId, Long equipmentId, LocalDateTime start, LocalDateTime end) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));
        Equipment equipment = equipmentRepository.findById(equipmentId)
                .orElseThrow(() -> new RuntimeException("Equipment not found."));
        
        //Prevent same user from holding multiple active requests for the same gear
        boolean alreadyHasBooking = bookingRepository.existsByEquipmentIdAndUserIdAndStatusIn(
                equipmentId, userId, activeStatuses);
        
        if (alreadyHasBooking) {
            throw new IllegalArgumentException("You already have an active or pending booking request for this equipment.");
        }
        
        boolean hasConflict = bookingRepository.existsOverlappingActiveBookingsForUpdate(
                equipmentId, start, end, activeStatuses);

        if (hasConflict) {
            Waitlist waitEntry = Waitlist.builder()
                    .user(user)
                    .equipment(equipment)
                    .startTime(start)
                    .endTime(end)
                    .createdAt(LocalDateTime.now())
                    .build();
            waitlistRepository.save(waitEntry);
            return "Slot conflicting with an active timeline. Auto-added to the Waitlist.";
        }

        Booking booking = Booking.builder()
                .user(user)
                .equipment(equipment)
                .startTime(start)
                .endTime(end)
                .status(BookingStatus.PENDING) // Needs Manager action to confirm
                .build();
        bookingRepository.save(booking);
        return "Booking request submitted successfully. Awaiting Manager approval.";
    }

    public List<Booking> getCalendar(Long userId, LocalDateTime start, LocalDateTime end) {
        return bookingRepository.findBookingsInCalendarRange(userId, start, end);
    }
    
    private Booking getBooking(Long bookingId) {

        return bookingRepository.findById(bookingId)
                .orElseThrow(() ->
                        new RuntimeException("Booking not found."));
    }
    
    @Transactional
    public void acceptBooking(Long bookingId) {

        Booking booking = getBooking(bookingId);

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalArgumentException(
                    "Only pending bookings can be accepted.");
        }

        booking.setStatus(BookingStatus.CONFIRMED);

        bookingRepository.save(booking);
    }
    
    @Transactional
    public void rejectBooking(Long bookingId) {

        Booking booking = getBooking(bookingId);

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalArgumentException(
                    "Only pending bookings can be rejected.");
        }

        booking.setStatus(BookingStatus.REJECTED);

        bookingRepository.save(booking);
    }
    
    @Transactional
    public void cancelBooking(Long bookingId) {

        Booking booking = getBooking(bookingId);

        if (booking.getStatus() != BookingStatus.PENDING &&
        	    booking.getStatus() != BookingStatus.CONFIRMED) {
        	throw new IllegalArgumentException("Only pending or confirmed bookings can be cancelled.");
        }

        booking.setStatus(BookingStatus.CANCELLED);

        bookingRepository.save(booking);

        promoteNextEligibleWaitlist(
                booking.getEquipment().getId());
    }
    
    @Transactional
    public void startBooking(Long bookingId, Authentication authentication) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found."));

        User loggedInUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found."));

        if (!booking.getUser().getId().equals(loggedInUser.getId())) {
            throw new IllegalArgumentException(
                    "You can only start your own booking.");
        }

        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new IllegalArgumentException(
                    "Only confirmed bookings can be started.");
        }

        booking.setStatus(BookingStatus.IN_PROGRESS);

        bookingRepository.save(booking);
    }
    
    @Transactional
    public void completeBooking(Long bookingId,
                                Authentication authentication) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found."));

        User loggedInUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found."));
        /*
         * Researchers can complete only their own booking.
         * Managers can complete any booking.
         */

        if (loggedInUser.getRole() == Role.RESEARCHER &&
                !booking.getUser().getId().equals(loggedInUser.getId())) {

            throw new IllegalArgumentException(
                    "Researchers can complete only their own bookings.");
        }

        if (booking.getStatus() != BookingStatus.IN_PROGRESS) {
            throw new IllegalArgumentException(
                    "Only bookings in progress can be completed.");
        }

        booking.setStatus(BookingStatus.COMPLETED);

        bookingRepository.save(booking);

        promoteNextEligibleWaitlist(
                booking.getEquipment().getId());
    }
    
    @Transactional(readOnly = true)
    public EquipmentUtilizationDTO calculateUtilization(
            Long equipmentId,
            LocalDateTime periodStart,
            LocalDateTime periodEnd) {

        Equipment equipment = equipmentRepository.findById(equipmentId)
                .orElseThrow(() ->
                        new RuntimeException("Equipment not found."));

        List<BookingStatus> statuses = List.of(
                BookingStatus.CONFIRMED,
                BookingStatus.IN_PROGRESS,
                BookingStatus.COMPLETED);

        List<Booking> bookings =
                bookingRepository.findBookingsForUtilization(
                        equipmentId,
                        periodStart,
                        periodEnd,
                        statuses);

        double bookedHours = 0;

        for (Booking booking : bookings) {

            LocalDateTime effectiveStart =
                    booking.getStartTime().isAfter(periodStart)
                            ? booking.getStartTime()
                            : periodStart;

            LocalDateTime effectiveEnd =
                    booking.getEndTime().isBefore(periodEnd)
                            ? booking.getEndTime()
                            : periodEnd;

            bookedHours +=
                    Duration.between(effectiveStart, effectiveEnd)
                            .toMinutes() / 60.0;
        }

        double availableHours =
                Duration.between(periodStart, periodEnd)
                        .toMinutes() / 60.0;

        double utilization = 0;

        if (availableHours > 0) {
            utilization =
                    (bookedHours / availableHours) * 100;
        }

        return new EquipmentUtilizationDTO(
                equipment.getId(),
                equipment.getEquipmentName(),      
                bookedHours,
                availableHours,
                utilization
        );
    }
    

    private void promoteNextEligibleWaitlist(Long equipmentId) {
        List<Waitlist> queue = waitlistRepository.findByEquipmentIdOrderByCreatedAtAsc(equipmentId);

        for (Waitlist entry : queue) {
            boolean isSlotBlocked = bookingRepository.existsOverlappingActiveBookingsForUpdate(
                    equipmentId, entry.getStartTime(), entry.getEndTime(), activeStatuses);

            if (!isSlotBlocked) {
                Booking promotedBooking = Booking.builder()
                        .user(entry.getUser())
                        .equipment(entry.getEquipment())
                        .startTime(entry.getStartTime())
                        .endTime(entry.getEndTime())
                        .status(BookingStatus.PENDING) // Automatically moves to manager's queue
                        .build();

                bookingRepository.save(promotedBooking);
                waitlistRepository.delete(entry);
                // Continue scanning in case other non-overlapping slots can be filled
            }
        }
    }
    @Transactional(readOnly = true)
    public ResearcherDashboardDto getResearcherDashboard(Long userId) {

        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("User profile not found.");
        }

        List<Booking> userBookings =
                bookingRepository.findByUserIdOrderByStartTimeAsc(userId);

        List<Waitlist> userWaitlist = waitlistRepository.findByUserIdOrderByCreatedAtAsc(userId);
        
        return new ResearcherDashboardDto(userBookings, userWaitlist);
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }
}