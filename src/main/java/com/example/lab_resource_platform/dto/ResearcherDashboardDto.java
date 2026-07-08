package com.example.lab_resource_platform.dto;

import java.util.List;

import com.example.lab_resource_platform.entity.Waitlist;
import com.example.lab_resource_platform.entity.Bookings.Booking;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ResearcherDashboardDto {
    private List<Booking> bookings;
    private List<Waitlist> waitlistEntries;
}