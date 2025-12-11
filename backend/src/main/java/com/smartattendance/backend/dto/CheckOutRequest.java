package com.smartattendance.backend.dto;

import com.smartattendance.backend.enums.AttendanceMethod;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CheckOutRequest {
    private LocalDateTime checkOutTime; //defaults to now
    private AttendanceMethod checkOutMethod;
    private Double latitude;
    private Double longitude;
    private String qrCode;
}
