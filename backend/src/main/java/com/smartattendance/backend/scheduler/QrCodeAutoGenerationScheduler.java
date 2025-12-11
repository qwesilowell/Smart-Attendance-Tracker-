package com.smartattendance.backend.scheduler;

import com.smartattendance.backend.entity.Organisation;
import com.smartattendance.backend.entity.QrCodeRecord;
import com.smartattendance.backend.repository.QrCodeRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class QrCodeAutoGenerationScheduler {

    private final QrCodeRecordRepository qrCodeRepository;

    // Runs every 5 minutes (300,000 milliseconds)
    // This job is now ONLY responsible for cleaning up expired codes.
    @Scheduled(fixedRate = 300000)
    public void deactivateExpiredQrCodes() {
        // Find all active QR codes that were set for auto-generation.
        // NOTE: This repository query does not sort. We rely on the service layer to handle the current/new code.
        List<QrCodeRecord> activeAutoGenQrs = qrCodeRepository
                .findByActiveTrueAndIsAutoGeneratingTrue();

        log.info("Starting QR code cleanup job. Found {} active auto-generation entries to check.", activeAutoGenQrs.size());

        // Group by organisation to ensure we check all relevant records
        Map<Organisation, QrCodeRecord> orgToQrMap = activeAutoGenQrs.stream()
                .collect(Collectors.toMap(
                        QrCodeRecord::getOrganisation,
                        qr -> qr,
                        (qr1, qr2) -> qr1  // Use a merge function to satisfy collectors.toMap requirements
                ));

        int deactivatedCount = 0;

        for (Map.Entry<Organisation, QrCodeRecord> entry : orgToQrMap.entrySet()) {
            QrCodeRecord currentQr = entry.getValue();

            // Check if expired
            if (currentQr.getExpiresAt().isBefore(LocalDateTime.now())) {

                log.info("QR code {} expired for org {}, deactivating.",
                        currentQr.getCode(), entry.getKey().getId());

                // Deactivate old QR
                currentQr.setActive(false);
                qrCodeRepository.save(currentQr);
                deactivatedCount++;
            }
        }

        log.info("QR code cleanup job finished. Deactivated {} expired codes.", deactivatedCount);
    }

    private String generateUniqueCode() {
        String uuid = UUID.randomUUID().toString().replace("-", "").substring(0, 10);
        return "SATad1-" + uuid;
    }
}