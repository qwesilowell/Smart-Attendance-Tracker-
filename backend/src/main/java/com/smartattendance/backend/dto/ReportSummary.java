package com.smartattendance.backend.dto;

public record ReportSummary(
        long totalRecords,
        long completeSessions,
        long activeSessions,
        long uniqueUsers,
        long lateArrivals,
        double totalHours,
        double averageHours,
        double completionRate
) {}

