package com.smartattendance.backend.dto;

import java.time.LocalDate;

public record ReportFilters(
        Long organisationId,
        LocalDate startDate,
        LocalDate endDate,
        Long userId,
        String reportType
) {}

