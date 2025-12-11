package com.smartattendance.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.Instant;

public record QrCodePayload(
        Long qrCodeId,
        Long organisationId,
        double organisationLatitude,
        double organisationLongitude,
        @JsonFormat(shape = JsonFormat.Shape.STRING)
        Instant expiresAt,
        String signature
) {}

