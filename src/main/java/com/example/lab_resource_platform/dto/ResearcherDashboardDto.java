package com.example.lab_resource_platform.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ResearcherDashboardDto {
    private List<BookingResponse> bookings;
    private List<WaitlistResponse> waitlistEntries;
}