package com.example.lab_resource_platform.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.lab_resource_platform.dto.ResearcherDashboardDto;
import com.example.lab_resource_platform.entity.Waitlist;
import com.example.lab_resource_platform.entity.Bookings.Booking;
import com.example.lab_resource_platform.entity.Bookings.BookingStatus;
import com.example.lab_resource_platform.entity.equipment.Equipment;
import com.example.lab_resource_platform.entity.user.User;
import com.example.lab_resource_platform.repository.BookingRepository;
import com.example.lab_resource_platform.repository.WaitlistRepository;
import com.example.lab_resource_platform.repository.auth.UserRepo;
import com.example.lab_resource_platform.repository.equipment.EquipmentRepo;

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
    @Transactional
    public void updateBookingStatus(Long bookingId, BookingStatus targetStatus) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found."));

        if (targetStatus != BookingStatus.CANCELLED && targetStatus != BookingStatus.COMPLETED) {
            booking.setStatus(targetStatus);
            bookingRepository.save(booking);
            return;
        }

        // Logic triggers if booking is cancelled or marked completed
        booking.setStatus(targetStatus);
        bookingRepository.save(booking);

        // Scan queue to elevate the next waitlisted researcher
        promoteNextEligibleWaitlist(booking.getEquipment().getId());
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
}