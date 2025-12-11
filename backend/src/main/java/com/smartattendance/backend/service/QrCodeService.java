package com.smartattendance.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.smartattendance.backend.dto.QrCodePayload;
import com.smartattendance.backend.dto.QrCodeRequest;
import com.smartattendance.backend.dto.ValidatedQrCode;
import com.smartattendance.backend.entity.Organisation;
import com.smartattendance.backend.entity.QrCodeRecord;
import com.smartattendance.backend.entity.Users;
import com.smartattendance.backend.exception.InvalidSignatureException;
import com.smartattendance.backend.exception.QrCodeException;
import com.smartattendance.backend.exception.ResourceNotFoundException;
import com.smartattendance.backend.repository.QrCodeRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class QrCodeService {

    private static final String QR_PREFIX = "SATad1";
    private static final double DEFAULT_LATITUDE = 5.631155029146822;
    private static final double DEFAULT_LONGITUDE = -0.22219213171956173;

    private final QrCodeRecordRepository qrCodeRepository;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    public QrCodeRecord startAutoGeneration(Users admin, QrCodeRequest request) {
        List<QrCodeRecord> existingQrs = qrCodeRepository
                .findByOrganisationAndActiveTrue(admin.getOrganisation());
        existingQrs.forEach(qr -> qr.setActive(false));
        qrCodeRepository.saveAll(existingQrs);

        QrCodeRecord qrCode = QrCodeRecord.builder()
                .code(generateUniqueCode())
                .organisation(admin.getOrganisation())
                .createdBy(admin)
                .latitude(resolveLatitude(admin.getOrganisation(), request.getLatitude()))
                .longitude(resolveLongitude(admin.getOrganisation(), request.getLongitude()))
                .radiusMeters(request.getRadiusMeters() != null ? request.getRadiusMeters() : 100)
                .createdAt(LocalDateTime.now(ZoneOffset.UTC))
                .expiresAt(LocalDateTime.now(ZoneOffset.UTC).plusMinutes(5))
                .active(true)
                .isAutoGenerating(true)
                .scanCount(0)
                .build();

        return persistWithPayload(qrCode);
    }

    public void stopAutoGeneration(Users admin) {
        List<QrCodeRecord> activeQrs = qrCodeRepository
                .findByOrganisationAndActiveTrue(admin.getOrganisation());

        activeQrs.forEach(qr -> {
            qr.setActive(false);
            qr.setAutoGenerating(false);
        });

        qrCodeRepository.saveAll(activeQrs);

        log.info("Stopped auto-generation for org {}", admin.getOrganisation().getId());
    }

    public QrCodeRecord getCurrentActiveQrCode(Organisation organisation) {
        List<QrCodeRecord> activeQrs = qrCodeRepository
                .findByOrganisationAndActiveTrue(organisation);

        if (activeQrs.isEmpty()) {
            return createFreshCode(organisation, null);
        }

        QrCodeRecord current = activeQrs.getFirst();
        if (current.getExpiresAt().isBefore(LocalDateTime.now(ZoneOffset.UTC))) {
            log.info("Active QR expired for org {}. Generating new one.", organisation.getId());
            current.setActive(false);
            qrCodeRepository.save(current);
            return createFreshCode(organisation, current);
        }

        ensurePayload(current);
        return current;
    }

    public boolean isAutoGenerating(Organisation organisation) {
        return qrCodeRepository.existsByOrganisationAndActiveTrueAndIsAutoGeneratingTrue(organisation);
    }

    public ValidatedQrCode validateQrCode(String rawPayload) {
        QrCodePayload payload = parsePayload(rawPayload);
        LocalDateTime expiresAt = LocalDateTime.ofInstant(payload.expiresAt(), ZoneOffset.UTC);

        String expectedSignature = buildSignature(payload.organisationId(), expiresAt);
        if (!expectedSignature.equals(payload.signature())) {
            throw new InvalidSignatureException("Invalid signature");
        }

        QrCodeRecord record = qrCodeRepository.findById(payload.qrCodeId())
                .orElseThrow(() -> new ResourceNotFoundException("QR code not found"));

        if (!record.isActive()) {
            throw new QrCodeException("This QR code is no longer active");
        }

        if (!record.getOrganisation().getId().equals(payload.organisationId())) {
            throw new QrCodeException("Wrong organization QR");
        }

        if (record.getExpiresAt().isBefore(LocalDateTime.now(ZoneOffset.UTC))) {
            record.setActive(false);
            qrCodeRepository.save(record);
            throw new QrCodeException("Expired QR Code");
        }

        return new ValidatedQrCode(record, payload);
    }

    public String buildPayload(QrCodeRecord record) {
        ensurePayload(record);
        return record.getPayload();
    }

    private QrCodeRecord createFreshCode(Organisation organisation, QrCodeRecord previous) {
        QrCodeRecord newQr = QrCodeRecord.builder()
                .code(generateUniqueCode())
                .organisation(organisation)
                .createdBy(previous != null ? previous.getCreatedBy() : null)
                .latitude(previous != null ? previous.getLatitude() : resolveLatitude(organisation, null))
                .longitude(previous != null ? previous.getLongitude() : resolveLongitude(organisation, null))
                .radiusMeters(previous != null ? previous.getRadiusMeters() : 100)
                .createdAt(LocalDateTime.now(ZoneOffset.UTC))
                .expiresAt(LocalDateTime.now(ZoneOffset.UTC).plusMinutes(5))
                .active(true)
                .isAutoGenerating(true)
                .scanCount(0)
                .build();

        return persistWithPayload(newQr);
    }

    private QrCodeRecord persistWithPayload(QrCodeRecord record) {
        QrCodeRecord saved = qrCodeRepository.save(record);
        saved.setSignature(buildSignature(saved.getOrganisation().getId(), saved.getExpiresAt()));
        saved.setPayload(buildPayloadString(saved));
        return qrCodeRepository.save(saved);
    }

    private void ensurePayload(QrCodeRecord record) {
        if (record.getPayload() == null || record.getSignature() == null) {
            record.setSignature(buildSignature(record.getOrganisation().getId(), record.getExpiresAt()));
            record.setPayload(buildPayloadString(record));
            qrCodeRepository.save(record);
        }
    }

    private double resolveLatitude(Organisation organisation, Double requested) {
        if (requested != null) {
            return requested;
        }
        if (organisation.getLatitude() != null) {
            return organisation.getLatitude();
        }
        return DEFAULT_LATITUDE;
    }

    private double resolveLongitude(Organisation organisation, Double requested) {
        if (requested != null) {
            return requested;
        }
        if (organisation.getLongitude() != null) {
            return organisation.getLongitude();
        }
        return DEFAULT_LONGITUDE;
    }

    private QrCodePayload parsePayload(String rawPayload) {
        try {
            return objectMapper.readValue(rawPayload, QrCodePayload.class);
        } catch (JsonProcessingException e) {
            log.error("Failed to parse QR payload {}", rawPayload, e);
            throw new QrCodeException("Invalid QR payload");
        }
    }

    private String buildPayloadString(QrCodeRecord record) {
        double lat = record.getLatitude() != null ? record.getLatitude() :
                resolveLatitude(record.getOrganisation(), null);
        double lon = record.getLongitude() != null ? record.getLongitude() :
                resolveLongitude(record.getOrganisation(), null);

        log.debug("Building QR payload for organisation {} with lat={}, lon={}",
                record.getOrganisation().getId(), lat, lon);

        QrCodePayload payload = new QrCodePayload(
                record.getId(),
                record.getOrganisation().getId(),
                lat,
                lon,
                record.getExpiresAt().toInstant(ZoneOffset.UTC),
                record.getSignature()
        );

        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            throw new QrCodeException("Failed to serialize QR payload");
        }
    }

    private String buildSignature(Long organisationId, LocalDateTime expiresAt) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String payload = QR_PREFIX + organisationId + expiresAt.toInstant(ZoneOffset.UTC).toEpochMilli();
            byte[] hash = digest.digest(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Unable to compute QR signature", e);
        }
    }

    private String generateUniqueCode() {
        String uuid = UUID.randomUUID().toString().replace("-", "").substring(0, 10);
        return QR_PREFIX + "-" + uuid;
    }
}
