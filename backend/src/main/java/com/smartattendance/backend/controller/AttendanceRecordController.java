package com.smartattendance.backend.controller;

import com.smartattendance.backend.dto.ApiResponse;
import com.smartattendance.backend.dto.AttendanceRecordResponse;
import com.smartattendance.backend.dto.AttendanceReport;
import com.smartattendance.backend.dto.CheckInRequest;
import com.smartattendance.backend.dto.CheckOutRequest;
import com.smartattendance.backend.dto.OrganisationReport;
import com.smartattendance.backend.dto.ReportExportPayload;
import com.smartattendance.backend.entity.AttendanceRecord;
import com.smartattendance.backend.entity.Organisation;
import com.smartattendance.backend.entity.Users;
import com.smartattendance.backend.enums.AttendanceMethod;
import com.smartattendance.backend.enums.ReportFormat;
import com.smartattendance.backend.security.CustomUserDetails;
import com.smartattendance.backend.service.AttendanceRecordService;
import com.smartattendance.backend.service.OrganisationService;
import com.smartattendance.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
@Slf4j
public class AttendanceRecordController {

        private final AttendanceRecordService attendanceRecordService;
        private final OrganisationService organisationService;
        private final UserService userService;

        /**
         * Get all attendance records for an organisation
         * GET /api/attendance?orgId=5
         */
        @GetMapping
        @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
        public ResponseEntity<?> getAllAttendanceRecords(
                        @RequestParam Long orgId,
                        @AuthenticationPrincipal CustomUserDetails currentUser) {
                // Validate user can access this organisation
                validateOrganisationAccess(currentUser, orgId);

                Organisation organisation = organisationService.findById(orgId);
                List<AttendanceRecord> records = attendanceRecordService.findAttendancesByOrganisation(organisation);

                List<AttendanceRecordResponse> response = attendanceRecordService.toResponseList(records);

                return ResponseEntity.ok(Map.of(
                                "success", true,
                                "message", "Attendance records retrieved successfully",
                                "count", response.size(),
                                "data", response));
        }

        /**
         * Get attendance records for a specific user within a date range
         * GET
         * /api/attendance/user/10?orgId=5&start=2025-01-01T00:00:00&end=2025-01-31T23:59:59
         */
        @GetMapping("/user/{userId}")
        @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
        public ResponseEntity<?> getUserAttendanceRecords(
                        @PathVariable Long userId,
                        @RequestParam Long orgId,
                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
                        @AuthenticationPrincipal CustomUserDetails currentUser) {
                // Validate organisation access
                validateOrganisationAccess(currentUser, orgId);

                // Regular users can only view their own attendance
                if (currentUser.getRole().name().equals("USER") && !currentUser.getId().equals(userId)) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                                        "success", false,
                                        "message", "You can only view your own attendance records"));
                }

                Organisation organisation = organisationService.findById(orgId);
                Users user = userService.findByIdInOrganisation(userId, organisation);

                List<AttendanceRecord> records = attendanceRecordService.findByUserAndDateRange(user, start, end);

                List<AttendanceRecordResponse> response = attendanceRecordService.toResponseList(records);

                return ResponseEntity.ok(Map.of(
                                "success", true,
                                "message", "User attendance records retrieved successfully",
                                "count", response.size(),
                                "data", response));
        }

        /**
         * Create a new attendance record (check-in)
         * POST /api/attendance?orgId=5
         * Body: {
         * "userId": 10,
         * "checkInTime": "2025-01-15T08:30:00",
         * "latitude": 5.603717,
         * "longitude": -0.186964,
         * "method": "MOBILE_APP"
         * }
         */
        @PostMapping("/check-in")
        @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
        public ResponseEntity<ApiResponse<AttendanceRecordResponse>> checkIn(
                        @RequestBody CheckInRequest request,
                        @AuthenticationPrincipal CustomUserDetails currentUser) {
                AttendanceRecordResponse response = attendanceRecordService.checkInWithQrCode(currentUser, request);

                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(ApiResponse.success("Check-in successful", response));
        }

        /**
         * Update attendance record (typically for check-out)
         * PUT /api/attendance/15?orgId=5
         * Body: {
         * "checkOutTime": "2025-01-15T17:30:00"
         * }
         */
        @PutMapping("/check-out/{recordId}")
        @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
        public ResponseEntity<?> updateCheckOut(
                        @PathVariable Long recordId,
                        @RequestBody CheckOutRequest request,
                        @AuthenticationPrincipal CustomUserDetails currentUser) {
                AttendanceRecord existing = attendanceRecordService.findById(recordId);

                // Users can only checkout their own records
                if (!existing.getUser().getId().equals(currentUser.getId())) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                                        "success", false,
                                        "message", "You can only check-out your own attendance"));
                }

                // Validate user belongs to their organisation
                Organisation org = existing.getUser().getOrganisation();

                LocalDateTime checkOutTime = request.getCheckOutTime() != null ? request.getCheckOutTime()
                                : LocalDateTime.now();

                AttendanceRecord updated = attendanceRecordService.updateCheckOut(
                                recordId, checkOutTime, org);

                log.info("User {} checked out at {}", currentUser.getEmail(), checkOutTime);

                AttendanceRecordResponse response = attendanceRecordService.toResponse(updated);

                return ResponseEntity.ok(Map.of(
                                "success", true,
                                "message", "Check-out successful",
                                "data", response));
        }

        @PostMapping("/check-in-qr")
        @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
        public ResponseEntity<ApiResponse<AttendanceRecordResponse>> checkInWithQr(
                        @RequestBody CheckInRequest request,
                        @AuthenticationPrincipal CustomUserDetails currentUser) {
                AttendanceRecordResponse response = attendanceRecordService.checkInWithQrCode(currentUser, request);
                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(ApiResponse.success("Check-in successful", response));
        }

        /**
         * Check-out (update today's attendance record)
         * Automatically finds today's check-in record
         * PUT /api/attendance/check-out
         */
        @PutMapping("/check-out")
        public ResponseEntity<?> checkOut(
                        @RequestBody CheckOutRequest request,
                        @AuthenticationPrincipal CustomUserDetails currentUser) {
                try {
                        AttendanceRecord updated = attendanceRecordService.checkOut(request, currentUser);
                        AttendanceRecordResponse response = attendanceRecordService.toResponse(updated);

                        return ResponseEntity.ok(Map.of(
                                        "success", true,
                                        "message", "Check-out successful",
                                        "data", response));
                } catch (RuntimeException e) {
                        return ResponseEntity.badRequest().body(Map.of(
                                        "success", false,
                                        "message", e.getMessage()));
                }
        }

        @PutMapping("/check-out-qr")
        @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
        public ResponseEntity<ApiResponse<AttendanceRecordResponse>> checkOutWithQr(
                        @RequestBody CheckOutRequest request,
                        @AuthenticationPrincipal CustomUserDetails currentUser) {
                AttendanceRecordResponse response = attendanceRecordService.checkOutWithQrCode(currentUser, request);
                return ResponseEntity.ok(ApiResponse.success("Check-out successful", response));
        }

        /**
         * Delete attendance record (ADMIN only)
         * DELETE /api/attendance/{recordId}?orgId=5
         */
        @DeleteMapping("/{recordId}")
        @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
        public ResponseEntity<?> deleteAttendanceRecord(
                        @PathVariable Long recordId,
                        @RequestParam Long orgId,
                        @AuthenticationPrincipal CustomUserDetails currentUser) {
                validateOrganisationAccess(currentUser, orgId);

                Organisation organisation = organisationService.findById(orgId);
                AttendanceRecord deleted = attendanceRecordService.softDelete(recordId, organisation);

                AttendanceRecordResponse response = attendanceRecordService.toResponse(deleted);

                return ResponseEntity.ok(Map.of(
                                "success", true,
                                "message", "Attendance record deleted successfully",
                                "data", response));
        }

        private void validateOrganisationAccess(CustomUserDetails currentUser, Long orgId) {
                if (currentUser.isSuperAdmin()) {
                        // SuperAdmin can access any organisation
                        return;
                }

                // Regular ADMIN/USER must match their organisation
                if (!currentUser.getOrganisationId().equals(orgId)) {
                        throw new RuntimeException("Access denied: You cannot access this organisation's data");
                }
        }

        /**
         * Get today's attendance status
         * Shows if user has checked in/out today
         * GET /api/attendance/today
         */
        @GetMapping("/today")
        public ResponseEntity<?> getTodayAttendance(
                @AuthenticationPrincipal CustomUserDetails currentUser) {

            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "message", "User not authenticated"));
            }

            AttendanceRecordResponse attendance = attendanceRecordService.getTodayAttendance(currentUser);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);

            if (attendance == null) {
                response.put("message", "No attendance record for today");
                response.put("data", null);
                response.put("hasCheckedIn", false);
                response.put("hasCheckedOut", false);
            } else {
                response.put("message", "Today's attendance retrieved");
                response.put("data", attendance);
                response.put("hasCheckedIn", true);
                response.put("hasCheckedOut", attendance.getCheckOutTime() != null);
            }

            return ResponseEntity.ok(response);
        }

        /**
         * Get last 7 attendance records for current user
         * GET /api/attendance/last7
         */
        @GetMapping("/last7")
        public ResponseEntity<?> getLast7AttendanceRecords(
                        @AuthenticationPrincipal CustomUserDetails currentUser) {

                if (currentUser == null) {
                        return ResponseEntity.status(401)
                                        .body(Map.of("success", false, "message", "Unauthenticated"));
                }

                List<AttendanceRecordResponse> last7 = attendanceRecordService.getLast7Records(currentUser);

                return ResponseEntity.ok(Map.of(
                                "success", true,
                                "count", last7.size(),
                                "data", last7));
        }

    /**
     * Get attendance reports for current user
     * GET /api/attendance/reports?period=week|month|quarter|year
     */
    @GetMapping("/reports")
    public ResponseEntity<?> getAttendanceReports(
            @RequestParam String period,
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(401)
                    .body(Map.of("success", false, "message", "Unauthenticated"));
        }

        AttendanceReport report = attendanceRecordService.generateReport(currentUser, period);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", report
        ));
    }

    /**
     * Generate organisation-wide attendance report
     */
    @GetMapping("/reports/organisation")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getOrganisationReport(
            @RequestParam Long orgId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "all") String reportType,
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        validateOrganisationAccess(currentUser, orgId);

        OrganisationReport report = attendanceRecordService.generateOrganisationReport(
                orgId,
                startDate,
                endDate,
                reportType,
                userId
        );

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", report
        ));
    }

    /**
     * Download organisation report (CSV/PDF)
     */
    @GetMapping("/reports/organisation/export")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ByteArrayResource> exportOrganisationReport(
            @RequestParam Long orgId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "all") String reportType,
            @RequestParam(defaultValue = "csv") String format,
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        validateOrganisationAccess(currentUser, orgId);

        ReportFormat reportFormat = ReportFormat.from(format);
        ReportExportPayload export = attendanceRecordService.exportOrganisationReport(
                orgId,
                startDate,
                endDate,
                reportType,
                userId,
                reportFormat
        );

        ByteArrayResource resource = new ByteArrayResource(export.content());

        return ResponseEntity.ok()
                .contentType(export.mediaType())
                .header("Content-Disposition", "attachment; filename=\"" + export.fileName() + "\"")
                .contentLength(export.content().length)
                .body(resource);
    }

    /**
     * Download personal attendance report
     */
    @GetMapping("/reports/export")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
    public ResponseEntity<ByteArrayResource> exportUserReport(
            @RequestParam(defaultValue = "month") String period,
            @RequestParam(defaultValue = "csv") String format,
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        ReportFormat reportFormat = ReportFormat.from(format);
        ReportExportPayload export = attendanceRecordService.exportUserReport(currentUser, period, reportFormat);
        ByteArrayResource resource = new ByteArrayResource(export.content());

        return ResponseEntity.ok()
                .contentType(export.mediaType())
                .header("Content-Disposition", "attachment; filename=\"" + export.fileName() + "\"")
                .contentLength(export.content().length)
                .body(resource);
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
    public ResponseEntity<Page<AttendanceRecordResponse>> getAttendanceHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        Page<AttendanceRecordResponse> history = attendanceRecordService
                .getAllUserAttendance(currentUser, page, size);

        return ResponseEntity.ok(history);
    }

    @GetMapping("/history/filter")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
    public ResponseEntity<Page<AttendanceRecordResponse>> getFilteredAttendanceHistory(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) AttendanceMethod method,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        Page<AttendanceRecordResponse> history = attendanceRecordService
                .getUserAttendanceWithFilters(currentUser, startDate, endDate, method, page, size);

        return ResponseEntity.ok(history);
    }

}
