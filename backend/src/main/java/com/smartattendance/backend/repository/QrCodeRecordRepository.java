package com.smartattendance.backend.repository;

import com.smartattendance.backend.entity.Organisation;
import com.smartattendance.backend.entity.QrCodeRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QrCodeRecordRepository extends JpaRepository<QrCodeRecord, Long> {
    Optional<QrCodeRecord> findByCode(String code);

    List<QrCodeRecord> findByOrganisationAndActiveTrue(Organisation organisation);

    List<QrCodeRecord> findByActiveTrueAndIsAutoGeneratingTrue();

    boolean existsByOrganisationAndActiveTrueAndIsAutoGeneratingTrue(Organisation organisation);
}

