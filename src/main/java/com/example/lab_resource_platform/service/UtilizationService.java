package com.example.lab_resource_platform.service;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.lab_resource_platform.dto.EquipmentUtilizationDTO;
import com.example.lab_resource_platform.entity.Bookings.Booking;
import com.example.lab_resource_platform.entity.Bookings.BookingStatus;
import com.example.lab_resource_platform.entity.equipment.Equipment;
import com.example.lab_resource_platform.entity.equipment.EquipmentStatus;
import com.example.lab_resource_platform.repository.BookingRepository;
import com.example.lab_resource_platform.repository.equipment.EquipmentRepo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UtilizationService {
    private final BookingRepository bookingRepo;
    private final EquipmentRepo equipmentRepo;
    private final BookingService bookingService;

    private final List<BookingStatus> utilizationStatuses = List.of(
            BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED);

    // ── Real-time ──
    @Transactional(readOnly = true)
    public Map<String, Object> realtime() {
        List<Booking> inUse = bookingRepo.findByStatus(BookingStatus.IN_PROGRESS);
        List<Map<String, Object>> inUseList = inUse.stream().map(b -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("equipmentId", b.getEquipment().getId());
            m.put("equipmentName", b.getEquipment().getEquipmentName());
            m.put("user", Map.of("id", b.getUser().getId(), "username", b.getUser().getUsername()));
            m.put("bookingId", b.getId());
            m.put("startTime", b.getStartTime());
            m.put("endTime", b.getEndTime());
            m.put("remainingMinutes", Duration.between(LocalDateTime.now(), b.getEndTime()).toMinutes());
            return m;
        }).toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("timestamp", LocalDateTime.now());
        result.put("inUseCount", inUse.size());
        result.put("availableCount", equipmentRepo.countByStatus(EquipmentStatus.AVAILABLE));
        result.put("bookedCount", equipmentRepo.countByStatus(EquipmentStatus.BOOKED));
        result.put("maintenanceCount", equipmentRepo.countByStatus(EquipmentStatus.UNDER_MAINTENANCE));
        result.put("inUseEquipment", inUseList);
        return result;
    }

    // ── Department ──
    @Transactional(readOnly = true)
    public Map<String, Object> departmentUtilization(Long deptId, LocalDateTime start, LocalDateTime end) {
        List<Equipment> deptEquipment = equipmentRepo.findByDepartmentId(deptId);
        return aggregate(deptEquipment, start, end, Map.of(
                "departmentId", deptId,
                "departmentName", deptEquipment.isEmpty() ? "" : deptEquipment.get(0).getDepartment().getName()
        ));
    }

    // ── Institution ──
    @Transactional(readOnly = true)
    public Map<String, Object> institutionUtilization(Long instId, LocalDateTime start, LocalDateTime end) {
        List<Equipment> instEquipment = equipmentRepo.findByInstitutionId(instId);
        return aggregate(instEquipment, start, end, Map.of(
                "institutionId", instId,
                "institutionName", instEquipment.isEmpty() ? "" : instEquipment.get(0).getInstitution().getName()
        ));
    }

    private Map<String, Object> aggregate(List<Equipment> equipmentList, LocalDateTime start,
                                          LocalDateTime end, Map<String, Object> extra) {
        double totalBooked = 0;
        List<EquipmentUtilizationDTO> perEq = new ArrayList<>();
        for (Equipment eq : equipmentList) {
            EquipmentUtilizationDTO u = bookingService.calculateUtilization(eq.getId(), start, end);
            perEq.add(u);
            totalBooked += u.getBookedHours();
        }
        double totalAvail = (Duration.between(start, end).toMinutes() / 60.0) * equipmentList.size();
        double pct = totalAvail > 0 ? (totalBooked / totalAvail) * 100 : 0;

        Map<String, Object> result = new LinkedHashMap<>(extra);
        result.put("periodStart", start);
        result.put("periodEnd", end);
        result.put("totalEquipment", equipmentList.size());
        result.put("totalBookedHours", totalBooked);
        result.put("totalAvailableHours", totalAvail);
        result.put("utilizationPercentage", Math.round(pct * 100.0) / 100.0);
        result.put("perEquipment", perEq);
        return result;
    }

    // ── Heatmap ──
    @Transactional(readOnly = true)
    public Map<String, Object> heatmap(Long equipmentId, LocalDateTime start, LocalDateTime end) {
        List<Booking> bookings = bookingRepo.findBookingsForUtilization(
                equipmentId, start, end, utilizationStatuses);
        Map<String, Double> bucketHours = new HashMap<>();
        Map<String, Integer> bucketCount = new HashMap<>();

        for (Booking b : bookings) {
            LocalDateTime cursor = b.getStartTime().isBefore(start) ? start : b.getStartTime();
            LocalDateTime stop = b.getEndTime().isAfter(end) ? end : b.getEndTime();
            while (cursor.isBefore(stop)) {
                LocalDateTime slotEnd = cursor.plusHours(1).withMinute(0).withSecond(0).withNano(0);
                if (slotEnd.isAfter(stop)) {
					slotEnd = stop;
				}
                String key = cursor.getDayOfWeek() + ":" + cursor.getHour();
                double hrs = Duration.between(cursor, slotEnd).toMinutes() / 60.0;
                bucketHours.merge(key, hrs, Double::sum);
                bucketCount.merge(key, 1, Integer::sum);
                cursor = slotEnd;
            }
        }

        List<Map<String, Object>> heatmap = bucketHours.keySet().stream()
                .<Map<String, Object>>map(k -> {
                    String[] parts = k.split(":");
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("dayOfWeek", parts[0]);
                    m.put("hourOfDay", Integer.parseInt(parts[1]));
                    m.put("bookedHours", bucketHours.get(k));
                    m.put("bookingCount", bucketCount.get(k));
                    return m;
                })
                .sorted(Comparator
                        .comparing((Map<String, Object> m) ->
                                DayOfWeek.valueOf((String) m.get("dayOfWeek")).ordinal())
                        .thenComparingInt(m -> (int) m.get("hourOfDay")))
                .toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("equipmentId", equipmentId);
        result.put("periodStart", start);
        result.put("periodEnd", end);
        result.put("heatmap", heatmap);
        return result;
    }

 // ── Idle report ──
    @Transactional(readOnly = true)
    public Map<String, Object> idleReport(
            LocalDateTime start,
            LocalDateTime end,
            double thresholdHours) {

        List<Equipment> active =
                equipmentRepo.findByStatusNot(EquipmentStatus.RETIRED);

        List<Map<String, Object>> idle = new ArrayList<>();

        for (Equipment eq : active) {

            // Use equipment creation date if equipment was created after report start
            LocalDateTime effectiveStart = start;

            if (eq.getCreatedAt() != null &&
                    eq.getCreatedAt().isAfter(start)) {

                effectiveStart = eq.getCreatedAt();
            }

            // Ignore equipment created after the report end date
            if (effectiveStart.isAfter(end)) {
                continue;
            }

            EquipmentUtilizationDTO u =
                    bookingService.calculateUtilization(
                            eq.getId(),
                            effectiveStart,
                            end
                    );

            double idleHours =
                    u.getAvailableHours() - u.getBookedHours();

            if (idleHours > thresholdHours) {

                Map<String, Object> m = new LinkedHashMap<>();

                m.put("equipmentId", eq.getId());
                m.put("equipmentName", eq.getEquipmentName());
                m.put("serial", eq.getSerial());

                m.put("createdAt", eq.getCreatedAt());

                m.put("department",
                        eq.getDepartment() != null
                                ? eq.getDepartment().getName()
                                : null);

                m.put("bookedHours", u.getBookedHours());
                m.put("availableHours", u.getAvailableHours());
                m.put("idleHours", idleHours);
                m.put("utilizationPercentage",
                        u.getUtilizationPercentage());

                m.put("status", eq.getStatus());

                idle.add(m);
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();

        result.put("periodStart", start);
        result.put("periodEnd", end);
        result.put("thresholdHours", thresholdHours);
        result.put("idleEquipment", idle);
        result.put("totalIdleCount", idle.size());

        return result;
    }


    // ── Peak analysis ──
    @Transactional(readOnly = true)
    public Map<String, Object> peakAnalysis(LocalDateTime start, LocalDateTime end) {
        List<Booking> bookings = bookingRepo.findAll().stream()
                .filter(b -> b.getStatus() != BookingStatus.CANCELLED && b.getStatus() != BookingStatus.REJECTED)
                .filter(b -> b.getStartTime().isBefore(end) && b.getEndTime().isAfter(start))
                .toList();

        Map<Integer, Double> hourly = new HashMap<>();
        Map<DayOfWeek, Double> daily = new HashMap<>();
        for (Booking b : bookings) {
            LocalDateTime cursor = b.getStartTime().isBefore(start) ? start : b.getStartTime();
            LocalDateTime stop = b.getEndTime().isAfter(end) ? end : b.getEndTime();
            while (cursor.isBefore(stop)) {
                LocalDateTime slotEnd = cursor.plusHours(1).withMinute(0).withSecond(0).withNano(0);
                if (slotEnd.isAfter(stop)) {
					slotEnd = stop;
				}
                double hrs = Duration.between(cursor, slotEnd).toMinutes() / 60.0;
                hourly.merge(cursor.getHour(), hrs, Double::sum);
                daily.merge(cursor.getDayOfWeek(), hrs, Double::sum);
                cursor = slotEnd;
            }
        }

        Map.Entry<Integer, Double> peakHour = hourly.entrySet().stream()
                .max(Map.Entry.comparingByValue()).orElse(null);
        Map.Entry<DayOfWeek, Double> peakDay = daily.entrySet().stream()
                .max(Map.Entry.comparingByValue()).orElse(null);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("periodStart", start);
        result.put("periodEnd", end);
        result.put("peakHourOfDay", peakHour != null ? peakHour.getKey() : null);
        result.put("peakDayOfWeek", peakDay != null ? peakDay.getKey() : null);
        result.put("peakHourBookedHours", peakHour != null ? peakHour.getValue() : 0);
        result.put("peakDayBookedHours", peakDay != null ? peakDay.getValue() : 0);
        result.put("hourlyDistribution", hourly.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> Map.of("hour", e.getKey(), "bookedHours", e.getValue()))
                .toList());
        result.put("dailyDistribution", daily.entrySet().stream()
                .sorted(Comparator.comparingInt(e -> e.getKey().ordinal()))
                .map(e -> Map.of("day", e.getKey(), "bookedHours", e.getValue()))
                .toList());
        return result;
    }

    // ── Benchmark ──
    @Transactional(readOnly = true)
    public Map<String, Object> benchmark(Long equipmentId, LocalDateTime start, LocalDateTime end) {
        EquipmentUtilizationDTO current = bookingService.calculateUtilization(equipmentId, start, end);

        // Look back 6 months from periodStart
        LocalDateTime histStart = start.minusMonths(6);
        LocalDateTime histEnd = start;
        List<Booking> histBookings = bookingRepo.findBookingsForUtilization(
                equipmentId, histStart, histEnd, utilizationStatuses);
        double histBooked = 0;
        Map<String, Double> monthly = new TreeMap<>();
        for (Booking b : histBookings) {
            LocalDateTime effStart = b.getStartTime().isAfter(histStart) ? b.getStartTime() : histStart;
            LocalDateTime effEnd = b.getEndTime().isBefore(histEnd) ? b.getEndTime() : histEnd;
            double hrs = Duration.between(effStart, effEnd).toMinutes() / 60.0;
            histBooked += hrs;
            String monthKey = effStart.getYear() + "-" + String.format("%02d", effStart.getMonthValue());
            monthly.merge(monthKey, hrs, Double::sum);
        }
        double histAvailHours = Duration.between(histStart, histEnd).toMinutes() / 60.0;
        double histAvg = histAvailHours > 0 ? (histBooked / histAvailHours) * 100 : 0;

        // Add current period
        String currentMonth = start.getYear() + "-" + String.format("%02d", start.getMonthValue());
        monthly.put(currentMonth, current.getBookedHours());

        String trend;
        double delta = current.getUtilizationPercentage() - histAvg;
        if (delta > 1) {
			trend = "INCREASING";
		} else if (delta < -1) {
			trend = "DECREASING";
		} else {
			trend = "STABLE";
		}

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("equipmentId", equipmentId);
        result.put("equipmentName", current.getEquipmentName());
        result.put("currentPeriod", Map.of("start", start, "end", end,
                "utilizationPercentage", current.getUtilizationPercentage()));
        result.put("historicalAverage", Map.of("periodMonths", 6, "utilizationPercentage", histAvg));
        result.put("trend", trend);
        result.put("deltaPercentage", Math.round(delta * 100.0) / 100.0);
        result.put("monthlyHistory", monthly.entrySet().stream()
                .map(e -> Map.of("month", e.getKey(), "utilizationPercentage", e.getValue()))
                .toList());
        return result;
    }

    // ── Shared vs Exclusive ──
    @Transactional(readOnly = true)
    public Map<String, Object> sharedVsExclusive(LocalDateTime start, LocalDateTime end) {
        List<Equipment> active = equipmentRepo.findByStatusNot(EquipmentStatus.RETIRED);
        List<Map<String, Object>> perEq = new ArrayList<>();
        int sharedCount = 0, exclusiveCount = 0;
        double sharedBooked = 0, exclusiveBooked = 0;
        double sharedUsers = 0, exclusiveUsers = 0;

        for (Equipment eq : active) {
            List<Booking> bookings = bookingRepo.findBookingsForUtilization(
                    eq.getId(), start, end, utilizationStatuses);
            Set<Long> uniqueUsers = bookings.stream().map(b -> b.getUser().getId()).collect(Collectors.toSet());
            double bookedHours = bookings.stream().mapToDouble(b -> {
                LocalDateTime s = b.getStartTime().isAfter(start) ? b.getStartTime() : start;
                LocalDateTime e = b.getEndTime().isBefore(end) ? b.getEndTime() : end;
                return Duration.between(s, e).toMinutes() / 60.0;
            }).sum();

            boolean shared = uniqueUsers.size() >= 3;
            if (shared) {
                sharedCount++; sharedBooked += bookedHours; sharedUsers += uniqueUsers.size();
            } else {
                exclusiveCount++; exclusiveBooked += bookedHours; exclusiveUsers += uniqueUsers.size();
            }

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("equipmentId", eq.getId());
            m.put("equipmentName", eq.getEquipmentName());
            m.put("type", shared ? "SHARED" : "EXCLUSIVE");
            m.put("uniqueUsers", uniqueUsers.size());
            m.put("bookedHours", bookedHours);
            perEq.add(m);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("periodStart", start);
        result.put("periodEnd", end);
        result.put("sharedEquipment", Map.of(
                "count", sharedCount,
                "totalBookedHours", sharedBooked,
                "avgUniqueUsersPerEquipment", sharedCount > 0 ? sharedUsers / sharedCount : 0
        ));
        result.put("exclusiveEquipment", Map.of(
                "count", exclusiveCount,
                "totalBookedHours", exclusiveBooked,
                "avgUniqueUsersPerEquipment", exclusiveCount > 0 ? exclusiveUsers / exclusiveCount : 0
        ));
        result.put("perEquipment", perEq);
        return result;
    }
}