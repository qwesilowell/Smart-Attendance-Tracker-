package com.smartattendance.backend.service;

import com.smartattendance.backend.dto.*;
import com.smartattendance.backend.entity.AttendanceRecord;
import com.smartattendance.backend.entity.Organisation;
import com.smartattendance.backend.entity.QrCodeRecord;
import com.smartattendance.backend.entity.Users;
import com.smartattendance.backend.enums.AttendanceMethod;
import com.smartattendance.backend.enums.ReportFormat;
import com.smartattendance.backend.exception.LocationValidationException;
import com.smartattendance.backend.exception.UnauthorizedException;
import com.smartattendance.backend.repository.AttendanceRecordRepository;
import com.smartattendance.backend.repository.QrCodeRecordRepository;
import com.smartattendance.backend.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttendanceRecordService {
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final UserService userService;
    private final OrganisationService organisationService;
    private final QrCodeService qrCodeService;
    private final QrCodeRecordRepository qrCodeRepository;

    private static final LocalTime LATE_THRESHOLD = LocalTime.of(8, 0);
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final DateTimeFormatter DATE_TIME_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public AttendanceRecord save(AttendanceRecord record) {
        return attendanceRecordRepository.save(record);
    }

    public List<AttendanceRecord> findByUserAndDateRange(Users user, LocalDateTime start, LocalDateTime end) {
        return attendanceRecordRepository.findByUserAndAttendanceDateBetween(user, start, end);
    }
    public List<AttendanceRecord> findAllAttendanceRecordsDeletedIncluded(){
        return attendanceRecordRepository.findByDeletedFalse();
    }

    public List <AttendanceRecord> findAllAttendances(){
        return attendanceRecordRepository.findAll();
    }

    public List <AttendanceRecord> findAttendancesByOrganisation (Organisation org){
        return attendanceRecordRepository.findByOrganisationAndNotDeleted(org);
    }

    //consider soft deleting attendance
    public AttendanceRecord softDelete(Long id, Organisation org) {
        AttendanceRecord record = attendanceRecordRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Attendance record not found"));

        // Verify record belongs to this organisation
        if (!record.getUser().getOrganisation().getId().equals(org.getId())) {
            throw new RuntimeException("Attendance record not found in this organisation");
        }

        record.setDeleted(true);
        return attendanceRecordRepository.save(record);
    }

    public AttendanceRecord findById(Long id) {
        return attendanceRecordRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Attendance record not found"));
    }

    @Transactional
    public AttendanceRecord checkIn(CheckInRequest request, CustomUserDetails currentUser) {
        Users user = userService.findByEmail(currentUser.getEmail());
        LocalDateTime now = LocalDateTime.now();

        if (attendanceRecordRepository.hasCheckedInToday(user, now)) {
            throw new RuntimeException("You have already checked in today. Please check-out first if you want to leave.");
        }

        Long orgId = currentUser.isSuperAdmin() ? currentUser.getCurrentOrganisationId() : currentUser.getOrganisationId();

        if (orgId == null) {
            throw new RuntimeException("No organisation context");
        }

        if (!user.getOrganisation().getId().equals(orgId)) {
            throw new RuntimeException("You can only check-in to your own organisation");
        }

        AttendanceRecord record = new AttendanceRecord();
        record.setUser(user);
        record.setCheckInTime(now);
        record.setAttendanceDate(now);
        record.setLatitude(request.getLatitude());
        record.setLongitude(request.getLongitude());
        record.setCheckInMethod(request.getCheckInMethod() != null ?
                request.getCheckInMethod() : AttendanceMethod.WEB);

        log.info("User {} checked in at {}", user.getEmail(), now);
        return attendanceRecordRepository.save(record);
    }

    @Transactional
    public AttendanceRecord checkOut(CheckOutRequest request, CustomUserDetails currentUser) {
        Users user = userService.findByEmail(currentUser.getEmail());
        LocalDateTime now = LocalDateTime.now();

        AttendanceRecord record = attendanceRecordRepository.findTodayAttendance(user, now)
                .orElseThrow(() -> new RuntimeException(
                        "No check-in record found for today. Please check-in first."
                ));

        if (record.getCheckOutTime() != null) {
            throw new RuntimeException(
                    "You have already checked out today at " + record.getCheckOutTime()
            );
        }

        Long orgId = currentUser.isSuperAdmin() ?
                currentUser.getCurrentOrganisationId() :
                currentUser.getOrganisationId();

        if (!record.getUser().getOrganisation().getId().equals(orgId)) {
            throw new RuntimeException("You can only check-out in your own organisation");
        }

        LocalDateTime checkOutTime = request.getCheckOutTime() != null ?
                request.getCheckOutTime() : now;

        // 5. Validate check-out time is after check-in time
        if (checkOutTime.isBefore(record.getCheckInTime())) {
            throw new RuntimeException("Check-out time cannot be before check-in time");
        }

        record.setCheckOutTime(checkOutTime);
        record.setCheckOutMethod(request.getCheckOutMethod() != null ?
                request.getCheckOutMethod() : AttendanceMethod.WEB);

        log.info("User {} checked out at {}", user.getEmail(), checkOutTime);
        return attendanceRecordRepository.save(record);
    }

    public AttendanceRecordResponse getTodayAttendance(CustomUserDetails currentUser) {
        Users user = userService.findByEmail(currentUser.getEmail());
        LocalDateTime now = LocalDateTime.now();

        return attendanceRecordRepository.findTodayAttendance(user, now)
                .map(this::toResponse)
                .orElse(AttendanceRecordResponse.builder()
                        .checkInTime(null)
                        .checkOutTime(null)
                        .build());
    }

    public AttendanceRecord updateCheckOut(Long id, LocalDateTime checkOutTime, Organisation org) {
        AttendanceRecord record = attendanceRecordRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Attendance record not found"));

        // Verify record belongs to this organisation
        if (!record.getUser().getOrganisation().getId().equals(org.getId())) {
            throw new RuntimeException("Attendance record not found in this organisation");
        }

        record.setCheckOutTime(checkOutTime);
        log.info("Updating check-out time for attendance ID: {} to: {}", id, checkOutTime);
        return attendanceRecordRepository.save(record);
    }

    public List<AttendanceRecordResponse> getLast7Records(CustomUserDetails currentUser) {
        Users user = userService.findById(currentUser.getId());

        Pageable pageable = PageRequest.of(0, 7); // page 0, size 7
        List<AttendanceRecord> records = attendanceRecordRepository
                .findLast7ByUser(user, pageable);

        return toResponseList(records);
    }

    /**
     * Convert AttendanceRecord entity to Response DTO
     */
    public AttendanceRecordResponse toResponse(AttendanceRecord record) {
        return AttendanceRecordResponse.builder()
                .id(record.getId())
                .checkInTime(record.getCheckInTime())
                .checkInMethod(record.getCheckInMethod())
                .checkOutTime(record.getCheckOutTime())
                .checkOutMethod(record.getCheckOutMethod())
                .latitude(record.getLatitude())
                .longitude(record.getLongitude())
                .attendanceDate(record.getAttendanceDate())
                .createdAt(record.getCreatedAt())
                .updatedAt(record.getUpdatedAt())
                .userId(record.getUser().getId())
                .userName(record.getUser().getFullName())
                .userEmail(record.getUser().getEmail())
                .build();
    }

    /**
     * Convert list of AttendanceRecord entities to list of Response DTOs
     */
    public List<AttendanceRecordResponse> toResponseList(List<AttendanceRecord> records) {
        return records.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public AttendanceReport generateReport(CustomUserDetails userDetails, String period) {
        Users user = userService.findById(userDetails.getId());
        LocalDate end = LocalDate.now();
        LocalDate start = switch (period) {
            case "week" -> end.minusDays(6);
            case "month" -> end.withDayOfMonth(1);
            case "quarter" -> end.minusMonths(2).withDayOfMonth(1);
            case "year" -> end.withDayOfYear(1);
            default -> end.minusDays(6);
        };

        // CONVERT TO LocalDateTime
        LocalDateTime startOfDay = start.atStartOfDay();
        LocalDateTime endOfDay = end.atTime(LocalTime.MAX);

        List<AttendanceRecord> records = attendanceRecordRepository
                .findByUserAndAttendanceDateBetween(user, startOfDay, endOfDay);

        List<DailyAttendance> daily = buildDailyAttendance(records);
        List<MethodCount> methods = buildMethodCounts(records);

        int totalDays = (int) ChronoUnit.DAYS.between(start, end) + 1;
        int presentDays = daily.size();
        int lateArrivals = (int) records.stream()
                .filter(r -> r.getCheckInTime() != null && r.getCheckInTime().toLocalTime().isAfter(LATE_THRESHOLD))
                .count();
        double avgHours = daily.stream().mapToDouble(DailyAttendance::hours).average().orElse(0.0);

        List<AttendanceRecordResponse> responseRecords = toResponseList(records);

        return new AttendanceReport(daily, methods, totalDays, presentDays, lateArrivals, avgHours, responseRecords);
    }

    public OrganisationReport generateOrganisationReport(
            Long orgId,
            LocalDate startDate,
            LocalDate endDate,
            String reportType,
            Long userId) {

        Organisation organisation = organisationService.findById(orgId);

        LocalDate start = startDate != null ? startDate : LocalDate.now().withDayOfMonth(1);
        LocalDate end = endDate != null ? endDate : LocalDate.now();

        if (end.isBefore(start)) {
            LocalDate temp = start;
            start = end;
            end = temp;
        }

        LocalDateTime startDateTime = start.atStartOfDay();
        LocalDateTime endDateTime = end.atTime(LocalTime.MAX);

        List<AttendanceRecord> records = attendanceRecordRepository
                .findByOrganisationAndFilters(organisation, startDateTime, endDateTime, userId);

        List<AttendanceRecord> filteredRecords = applyReportTypeFilter(records, reportType);

        ReportFilters filters = new ReportFilters(
                orgId,
                start,
                end,
                userId,
                normalizeReportType(reportType)
        );

        List<DailyAttendance> daily = buildDailyAttendance(filteredRecords);
        List<MethodCount> methods = buildMethodCounts(filteredRecords);
        ReportSummary summary = buildReportSummary(filteredRecords);
        List<AttendanceRecordResponse> responses = toResponseList(filteredRecords);

        return new OrganisationReport(filters, summary, daily, methods, responses);
    }

    public ReportExportPayload exportOrganisationReport(
            Long orgId,
            LocalDate startDate,
            LocalDate endDate,
            String reportType,
            Long userId,
            ReportFormat format) {

        OrganisationReport report = generateOrganisationReport(orgId, startDate, endDate, reportType, userId);

        byte[] content = switch (format) {
            case PDF -> buildOrganisationPdf(report);
            case CSV -> buildOrganisationCsv(report);
        };

        String fileName = "organisation-attendance-report-"
                + report.filters().startDate()
                + "-" + report.filters().endDate()
                + "." + format.extension();

        return new ReportExportPayload(content, fileName, format.mediaType());
    }

    public ReportExportPayload exportUserReport(
            CustomUserDetails currentUser,
            String period,
            ReportFormat format) {

        AttendanceReport report = generateReport(currentUser, period);
        Users user = userService.findById(currentUser.getId());

        byte[] content = switch (format) {
            case PDF -> buildUserPdf(user, report, period);
            case CSV -> buildUserCsv(user, report, period);
        };

        String fileName = "attendance-report-" + period + "." + format.extension();

        return new ReportExportPayload(content, fileName, format.mediaType());
    }

    /**
     * Get all attendance records for a user with pagination
     */
    public Page<AttendanceRecordResponse> getAllUserAttendance(
            CustomUserDetails currentUser,
            int page,
            int size) {

        Users user = userService.findById(currentUser.getId());
        Pageable pageable = PageRequest.of(page, size, Sort.by("attendanceDate").descending());

        Page<AttendanceRecord> records = attendanceRecordRepository.findAllByUser(user, pageable);

        return records.map(this::toResponse);
    }

    /**
     * Get all attendance records for a user with optional filters
     */
    public Page<AttendanceRecordResponse>
    getUserAttendanceWithFilters(
            CustomUserDetails currentUser,
            LocalDate startDate,
            LocalDate endDate,
            AttendanceMethod method,
            int page,
            int size) {

        Users user = userService.findById(currentUser.getId());

        // Convert to LocalDateTime
        LocalDateTime start = startDate != null
                ? startDate.atStartOfDay()
                : LocalDateTime.now().minusWeeks(6);
        LocalDateTime end = endDate != null ? endDate.atTime(LocalTime.MAX) : LocalDateTime.now();

        Pageable pageable = PageRequest.of(page, size, Sort.by("attendanceDate").descending());

        Page<AttendanceRecord> records = attendanceRecordRepository
                .findByUserAndFilters(user, start, end, method, pageable);

        return records.map(this::toResponse);
    }

    public AttendanceRecordResponse checkInWithQrCode(CustomUserDetails currentUser, CheckInRequest request) {
        Users user = userService.findByEmail(currentUser.getEmail());

        if (request.getLatitude() == null || request.getLongitude() == null) {
            throw new LocationValidationException("Device location is required to complete check-in");
        }

        log.info("Received QR payload length: {}", request.getQrCode() != null ? request.getQrCode().length() : "null");

        var validated = qrCodeService.validateQrCode(request.getQrCode());
        QrCodeRecord qrCode = validated.qrCodeRecord();

        if (!user.getOrganisation().getId().equals(qrCode.getOrganisation().getId())) {
            throw new UnauthorizedException("Wrong organization QR");
        }

        LocalDateTime todayStart = LocalDateTime.now().toLocalDate().atStartOfDay();

        if (attendanceRecordRepository.hasCheckedInToday(user, todayStart)) {
            throw new RuntimeException("You have already checked in today. Please check-out first if you want to leave.");
        }

        double orgLat = qrCode.getLatitude() != null ? qrCode.getLatitude() : validated.payload().organisationLatitude();
        double orgLon = qrCode.getLongitude() != null ? qrCode.getLongitude() : validated.payload().organisationLongitude();
        double userLat = request.getLatitude();
        double userLon = request.getLongitude();

        double distance = calculateDistance(orgLat, orgLon, userLat, userLon);

        log.info("[Check-In Distance] userLat={}, userLon={}, orgLat={}, orgLon={}, distance={}m",
                userLat, userLon, orgLat, orgLon, distance);

        if (distance > qrCode.getRadiusMeters()) {
            throw new LocationValidationException(
                    String.format("You are too far (%.0f meters away)", distance));
        }

        AttendanceRecord attendance = new AttendanceRecord();
        attendance.setUser(user);
        attendance.setCheckInTime(LocalDateTime.now());
        attendance.setAttendanceDate(LocalDateTime.now());
        attendance.setLatitude(userLat);
        attendance.setLongitude(userLon);
        attendance.setCheckInMethod(AttendanceMethod.WEB);

        attendance = attendanceRecordRepository.save(attendance);

        qrCode.setScanCount(qrCode.getScanCount() + 1);
        qrCodeRepository.save(qrCode);

        return toResponse(attendance);
    }

    private List<AttendanceRecord> applyReportTypeFilter(List<AttendanceRecord> records, String reportType) {
        if (records == null || records.isEmpty()) {
            return Collections.emptyList();
        }

        String normalized = normalizeReportType(reportType);

        if ("complete".equals(normalized)) {
            return records.stream()
                    .filter(r -> r.getCheckOutTime() != null)
                    .collect(Collectors.toList());
        }

        if ("active".equals(normalized)) {
            return records.stream()
                    .filter(r -> r.getCheckOutTime() == null)
                    .collect(Collectors.toList());
        }

        return records;
    }

    private String normalizeReportType(String reportType) {
        if (reportType == null || reportType.isBlank()) {
            return "all";
        }

        String normalized = reportType.trim().toLowerCase();
        return switch (normalized) {
            case "complete", "active" -> normalized;
            default -> "all";
        };
    }

    private ReportSummary buildReportSummary(List<AttendanceRecord> records) {
        long totalRecords = records.size();
        long completeSessions = records.stream()
                .filter(r -> r.getCheckOutTime() != null)
                .count();
        long activeSessions = totalRecords - completeSessions;
        long uniqueUsers = records.stream()
                .map(r -> r.getUser().getId())
                .distinct()
                .count();
        long lateArrivals = records.stream()
                .filter(r -> r.getCheckInTime() != null && r.getCheckInTime().toLocalTime().isAfter(LATE_THRESHOLD))
                .count();
        double totalHours = records.stream()
                .filter(r -> r.getCheckInTime() != null && r.getCheckOutTime() != null)
                .mapToDouble(this::calculateDurationHours)
                .sum();
        double averageHours = completeSessions > 0 ? totalHours / completeSessions : 0.0;
        double completionRate = totalRecords == 0 ? 0.0 : (double) completeSessions / totalRecords * 100.0;

        return new ReportSummary(
                totalRecords,
                completeSessions,
                activeSessions,
                uniqueUsers,
                lateArrivals,
                roundToOneDecimal(totalHours),
                roundToOneDecimal(averageHours),
                roundToOneDecimal(completionRate)
        );
    }

    private List<DailyAttendance> buildDailyAttendance(List<AttendanceRecord> records) {
        Map<LocalDate, Double> totals = records.stream()
                .filter(r -> r.getAttendanceDate() != null)
                .collect(Collectors.groupingBy(
                        r -> r.getAttendanceDate().toLocalDate(),
                        Collectors.summingDouble(r ->
                                r.getCheckInTime() != null && r.getCheckOutTime() != null
                                        ? calculateDurationHours(r)
                                        : 0.0)
                ));

        return totals.entrySet().stream()
                .map(entry -> new DailyAttendance(
                        entry.getKey().format(DATE_FORMAT),
                        roundToOneDecimal(entry.getValue())))
                .sorted(Comparator.comparing(DailyAttendance::date))
                .collect(Collectors.toList());
    }

    private List<MethodCount> buildMethodCounts(List<AttendanceRecord> records) {
        return records.stream()
                .filter(r -> r.getCheckInMethod() != null)
                .collect(Collectors.groupingBy(AttendanceRecord::getCheckInMethod, Collectors.counting()))
                .entrySet().stream()
                .map(entry -> new MethodCount(entry.getKey().name(), entry.getValue().intValue()))
                .collect(Collectors.toList());
    }

    private double calculateDurationHours(AttendanceRecord record) {
        if (record.getCheckInTime() == null || record.getCheckOutTime() == null) {
            return 0.0;
        }
        return Duration.between(record.getCheckInTime(), record.getCheckOutTime()).toMinutes() / 60.0;
    }

    private double roundToOneDecimal(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private byte[] buildOrganisationCsv(OrganisationReport report) {
        StringBuilder builder = new StringBuilder();
        builder.append("Organisation Attendance Report").append("\n");
        builder.append("Organisation ID,").append(report.filters().organisationId()).append("\n");
        builder.append("Date Range,").append(report.filters().startDate())
                .append(" - ").append(report.filters().endDate()).append("\n");

        if (report.filters().userId() != null) {
            builder.append("User Filter,").append(report.filters().userId()).append("\n");
        }

        builder.append("Report Type,").append(report.filters().reportType()).append("\n\n");
        builder.append("Summary Metrics").append("\n");
        builder.append("Metric,Value").append("\n");
        builder.append("Total Records,").append(report.summary().totalRecords()).append("\n");
        builder.append("Complete Sessions,").append(report.summary().completeSessions()).append("\n");
        builder.append("Active Sessions,").append(report.summary().activeSessions()).append("\n");
        builder.append("Unique Users,").append(report.summary().uniqueUsers()).append("\n");
        builder.append("Late Arrivals,").append(report.summary().lateArrivals()).append("\n");
        builder.append("Total Hours,").append(report.summary().totalHours()).append("\n");
        builder.append("Average Hours,").append(report.summary().averageHours()).append("\n");
        builder.append("Completion Rate (%),").append(report.summary().completionRate()).append("\n\n");

        builder.append("Detailed Records").append("\n");
        builder.append("Name,Email,Date,Check-in,Check-out,Status,Check-in Method,Check-out Method").append("\n");

        for (AttendanceRecordResponse record : report.records()) {
            builder.append(csvValue(record.getUserName())).append(",")
                    .append(csvValue(record.getUserEmail())).append(",")
                    .append(csvValue(formatDate(record.getAttendanceDate()))).append(",")
                    .append(csvValue(formatDateTime(record.getCheckInTime()))).append(",")
                    .append(csvValue(formatDateTime(record.getCheckOutTime()))).append(",")
                    .append(csvValue(record.getCheckOutTime() != null ? "Complete" : "Active")).append(",")
                    .append(csvValue(methodName(record.getCheckInMethod()))).append(",")
                    .append(csvValue(methodName(record.getCheckOutMethod())))
                    .append("\n");
        }

        return builder.toString().getBytes(StandardCharsets.UTF_8);
    }

    private byte[] buildUserCsv(Users user, AttendanceReport report, String period) {
        StringBuilder builder = new StringBuilder();
        builder.append("Attendance Report").append("\n");
        builder.append("User,").append(csvValue(user.getFullName())).append("\n");
        builder.append("Email,").append(csvValue(user.getEmail())).append("\n");
        builder.append("Period,").append(period).append("\n\n");

        builder.append("Summary").append("\n");
        builder.append("Metric,Value").append("\n");
        builder.append("Total Days,").append(report.totalDays()).append("\n");
        builder.append("Present Days,").append(report.presentDays()).append("\n");
        builder.append("Late Arrivals,").append(report.lateArrivals()).append("\n");
        builder.append("Average Hours,").append(roundToOneDecimal(report.averageHours())).append("\n\n");

        builder.append("Detailed Records").append("\n");
        builder.append("Date,Check-in,Check-out,Status,Check-in Method,Check-out Method").append("\n");

        for (AttendanceRecordResponse record : report.records()) {
            builder.append(csvValue(formatDate(record.getAttendanceDate()))).append(",")
                    .append(csvValue(formatDateTime(record.getCheckInTime()))).append(",")
                    .append(csvValue(formatDateTime(record.getCheckOutTime()))).append(",")
                    .append(csvValue(record.getCheckOutTime() != null ? "Complete" : "Active")).append(",")
                    .append(csvValue(methodName(record.getCheckInMethod()))).append(",")
                    .append(csvValue(methodName(record.getCheckOutMethod())))
                    .append("\n");
        }

        if (report.records().isEmpty()) {
            builder.append("No attendance activity for the selected period").append("\n");
        }

        return builder.toString().getBytes(StandardCharsets.UTF_8);
    }

    private byte[] buildOrganisationPdf(OrganisationReport report) {
        List<String> lines = new ArrayList<>();
        lines.add("##Organisation Attendance Report");
        lines.add("Organisation ID: " + report.filters().organisationId());
        lines.add("Date Range: " + report.filters().startDate() + " - " + report.filters().endDate());

        if (report.filters().userId() != null) {
            lines.add("User Filter: " + report.filters().userId());
        }

        lines.add("Report Type: " + report.filters().reportType());
        lines.add("");
        lines.add("##Summary");
        lines.add("Total Records: " + report.summary().totalRecords());
        lines.add("Complete Sessions: " + report.summary().completeSessions());
        lines.add("Active Sessions: " + report.summary().activeSessions());
        lines.add("Unique Users: " + report.summary().uniqueUsers());
        lines.add("Late Arrivals: " + report.summary().lateArrivals());
        lines.add("Total Hours: " + report.summary().totalHours());
        lines.add("Average Hours: " + report.summary().averageHours());
        lines.add("Completion Rate: " + report.summary().completionRate() + "%");
        lines.add("");
        lines.add("##Detailed Records");

        if (report.records().isEmpty()) {
            lines.add("No attendance records for the selected filters.");
        } else {
            for (AttendanceRecordResponse record : report.records()) {
                lines.add(formatPdfRecordLine(record));
            }
        }

        return buildPdfDocument(lines);
    }

    private byte[] buildUserPdf(Users user, AttendanceReport report, String period) {
        List<String> lines = new ArrayList<>();
        lines.add("##Attendance Report");
        lines.add("User: " + user.getFullName());
        lines.add("Email: " + user.getEmail());
        lines.add("Period: " + period);
        lines.add("");
        lines.add("##Summary");
        lines.add("Total Days: " + report.totalDays());
        lines.add("Present Days: " + report.presentDays());
        lines.add("Late Arrivals: " + report.lateArrivals());
        lines.add("Average Hours/Day: " + roundToOneDecimal(report.averageHours()));
        lines.add("");
        lines.add("##Detailed Records");

        if (report.records().isEmpty()) {
            lines.add("No attendance activity for the selected period.");
        } else {
            for (AttendanceRecordResponse record : report.records()) {
                lines.add(formatPdfRecordLine(record));
            }
        }

        return buildPdfDocument(lines);
    }

    private byte[] buildPdfDocument(List<String> lines) {
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.LETTER);
            document.addPage(page);
            PDPageContentStream content = new PDPageContentStream(document, page);
            float y = 770f;

            for (String rawLine : lines) {
                String line = rawLine != null ? rawLine : "";

                if (y < 60f) {
                    content.close();
                    page = new PDPage(PDRectangle.LETTER);
                    document.addPage(page);
                    content = new PDPageContentStream(document, page);
                    y = 770f;
                }

                if (line.isBlank()) {
                    y -= 12f;
                    continue;
                }

                boolean heading = line.startsWith("##");
                boolean bold = heading || line.startsWith("**");
                if (heading) {
                    line = line.substring(2).trim();
                } else if (bold) {
                    line = line.substring(2).trim();
                }

                float fontSize = heading ? 14f : 11f;

                content.beginText();
                content.setFont(bold ? PDType1Font.HELVETICA_BOLD : PDType1Font.HELVETICA, fontSize);
                content.newLineAtOffset(50f, y);
                content.showText(line);
                content.endText();

                y -= heading ? 22f : 16f;
            }

            content.close();
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            document.save(output);
            return output.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Unable to generate PDF report", e);
        }
    }

    private String formatPdfRecordLine(AttendanceRecordResponse record) {
        return String.format(
                "%s | %s | %s | In: %s | Out: %s | %s",
                safe(record.getUserName()),
                safe(record.getUserEmail()),
                formatDate(record.getAttendanceDate()),
                formatDateTime(record.getCheckInTime()),
                formatDateTime(record.getCheckOutTime()),
                record.getCheckOutTime() != null ? "Complete" : "Active"
        );
    }

    private String csvValue(String value) {
        if (value == null) {
            return "";
        }

        String sanitized = value.replace("\n", " ").replace("\r", " ");
        if (sanitized.contains(",") || sanitized.contains("\"")) {
            return "\"" + sanitized.replace("\"", "\"\"") + "\"";
        }
        return sanitized;
    }

    private String methodName(AttendanceMethod method) {
        return method != null ? method.name() : "-";
    }

    private String formatDate(LocalDateTime dateTime) {
        return dateTime != null ? dateTime.toLocalDate().format(DATE_FORMAT) : "-";
    }

    private String formatDateTime(LocalDateTime dateTime) {
        return dateTime != null ? dateTime.format(DATE_TIME_FORMAT) : "-";
    }

    private String safe(String value) {
        return value != null ? value : "-";
    }

    // Check-out using QR code
    public AttendanceRecordResponse checkOutWithQrCode(CustomUserDetails currentUser, CheckOutRequest request) {
        Users user = userService.findByEmail(currentUser.getEmail());
        if (request.getLatitude() == null || request.getLongitude() == null) {
            throw new LocationValidationException("Device location is required to complete check-out");
        }

        var validated = qrCodeService.validateQrCode(request.getQrCode());
        QrCodeRecord qrCode = validated.qrCodeRecord();

        if (!user.getOrganisation().getId().equals(qrCode.getOrganisation().getId())) {
            throw new UnauthorizedException("Wrong organization QR");
        }

        LocalDateTime todayStart = LocalDateTime.now().toLocalDate().atStartOfDay();
        AttendanceRecord attendance = attendanceRecordRepository.findTodayAttendance(user, todayStart)
                .orElseThrow(() -> new RuntimeException(
                        "No check-in record found for today. Please check-in first."
                ));

        double orgLat = qrCode.getLatitude() != null ? qrCode.getLatitude() : validated.payload().organisationLatitude();
        double orgLon = qrCode.getLongitude() != null ? qrCode.getLongitude() : validated.payload().organisationLongitude();
        double userLat = request.getLatitude();
        double userLon = request.getLongitude();

        double distance = calculateDistance(orgLat, orgLon, userLat, userLon);
        log.info("[Check-Out Distance] userLat={}, userLon={}, orgLat={}, orgLon={}, distance={}m",
                userLat, userLon, orgLat, orgLon, distance);

        if (distance > qrCode.getRadiusMeters()) {
            throw new LocationValidationException(
                    String.format("You are too far (%.0f meters away)", distance));
        }

        attendance.setCheckOutTime(LocalDateTime.now());
        attendance.setCheckOutMethod(AttendanceMethod.WEB);

        attendance = attendanceRecordRepository.save(attendance);

        qrCode.setScanCount(qrCode.getScanCount() + 1);
        qrCodeRepository.save(qrCode);

        return toResponse(attendance);
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371e3;
        double φ1 = Math.toRadians(lat1);
        double φ2 = Math.toRadians(lat2);
        double Δφ = Math.toRadians(lat2 - lat1);
        double Δλ = Math.toRadians(lon2 - lon1);

        double a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }
}

