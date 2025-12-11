package com.smartattendance.backend.repository;

import com.smartattendance.backend.entity.AttendanceRecord;
import com.smartattendance.backend.entity.AttendanceRecord;
import com.smartattendance.backend.entity.Organisation;
import com.smartattendance.backend.entity.Users;
import com.smartattendance.backend.enums.AttendanceMethod;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {
    List<AttendanceRecord> findByUserAndAttendanceDateBetween(Users user, LocalDateTime start, LocalDateTime end);

    Optional<AttendanceRecord> findByIdAndDeletedFalse(Long id);

    List<AttendanceRecord> findByDeletedFalse();

    @Query("SELECT ar FROM AttendanceRecord ar WHERE ar.user.organisation = :organisation AND ar.deleted = false")
    List<AttendanceRecord> findByOrganisationAndNotDeleted(@Param("organisation") Organisation organisation);

    @Query("SELECT ar FROM AttendanceRecord ar WHERE ar.user = :user " +
            "AND ar.deleted = false " +
            "AND DATE(ar.attendanceDate) = DATE(:date)")
    Optional<AttendanceRecord> findTodayAttendance(@Param("user") Users user,
                                                   @Param("date") LocalDateTime date);

    @Query("SELECT COUNT(ar) > 0 FROM AttendanceRecord ar WHERE ar.user = :user " +
            "AND ar.deleted = false " +
            "AND DATE(ar.attendanceDate) = DATE(:today)")
    boolean hasCheckedInToday(@Param("user") Users user, @Param("today") LocalDateTime today);

    @Query("SELECT a FROM AttendanceRecord a " +
            "WHERE a.user = :user AND a.deleted = false " +
            "ORDER BY a.attendanceDate DESC, a.checkInTime DESC")
    List<AttendanceRecord> findLast7ByUser(
            @Param("user") Users user,
            Pageable pageable
    );

    @Query("SELECT a FROM AttendanceRecord a WHERE a.user = :user AND a.deleted = false ORDER BY a.attendanceDate DESC")
    Page<AttendanceRecord> findAllByUser(@Param("user") Users user, Pageable pageable);

    @Query("SELECT a FROM AttendanceRecord a WHERE a.user = :user " +
            "AND a.deleted = false " +
            "AND a.attendanceDate BETWEEN :start AND :end " +
            "AND (:method IS NULL OR a.checkInMethod = :method) " +
            "ORDER BY a.attendanceDate DESC")
    Page<AttendanceRecord> findByUserAndFilters(
            @Param("user") Users user,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("method") AttendanceMethod method,
            Pageable pageable
    );

    @Query("SELECT a FROM AttendanceRecord a WHERE a.deleted = false " +
            "AND a.user.organisation = :organisation " +
            "AND a.attendanceDate BETWEEN :start AND :end " +
            "AND (:userId IS NULL OR a.user.id = :userId) " +
            "ORDER BY a.attendanceDate DESC")
    List<AttendanceRecord> findByOrganisationAndFilters(
            @Param("organisation") Organisation organisation,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("userId") Long userId
    );
}

