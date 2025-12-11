package com.smartattendance.backend.entity;

import com.smartattendance.backend.enums.AttendanceMethod;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "attendance_records")
public class AttendanceRecord extends BaseEntity implements Serializable {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;

    @Column(name = "check_in_time", nullable = false)
    private LocalDateTime checkInTime;

    @Column(name = "check_out_time")
    private LocalDateTime checkOutTime;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Enumerated(EnumType.STRING)
    @Column(name = "check_in_method", nullable = false)
    private AttendanceMethod checkInMethod; // ← NEW

    @Enumerated(EnumType.STRING)

    @Column(name = "check_out_method")
    private AttendanceMethod checkOutMethod;

    @Column(name = "attendance_date", nullable = false)
    private LocalDateTime attendanceDate; // can be used for quick filtering
}
