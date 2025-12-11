package com.smartattendance.backend.dto;

import java.util.List;

public record OrganisationReport(
        ReportFilters filters,
        ReportSummary summary,
        List<DailyAttendance> dailyAttendance,
        List<MethodCount> checkInMethods,
        List<AttendanceRecordResponse> records
) {}

