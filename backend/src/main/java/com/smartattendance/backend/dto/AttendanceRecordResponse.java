package com.smartattendance.backend.dto;

import com.smartattendance.backend.enums.AttendanceMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for AttendanceRecord
 * Used when returning attendance data to the client
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceRecordResponse {
    private Long id;
    private LocalDateTime checkInTime;
    private AttendanceMethod checkInMethod;
    private LocalDateTime checkOutTime;
    private AttendanceMethod checkOutMethod;
    private Double latitude;
    private Double longitude;
    private LocalDateTime attendanceDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // User info (no sensitive data like password)
    private Long userId;
    private String userName;
    private String userEmail;
}

