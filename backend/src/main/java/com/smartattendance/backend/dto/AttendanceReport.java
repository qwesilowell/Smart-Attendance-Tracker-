package com.smartattendance.backend.dto;

import java.util.List;

public record AttendanceReport(
        List<DailyAttendance> dailyAttendance,
        List<MethodCount> checkInMethods,
        int totalDays,
        int presentDays,
        int lateArrivals,
        double averageHours,
        List<AttendanceRecordResponse> records
) {}

