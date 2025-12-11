package com.smartattendance.backend.dto;

import com.smartattendance.backend.enums.AttendanceMethod;
import lombok.Data;

@Data
public class CheckInRequest {
    private Double latitude;
    private Double longitude;
    private AttendanceMethod checkInMethod;
    private String qrCode;
}