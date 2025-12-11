package com.smartattendance.backend.dto;

import com.smartattendance.backend.entity.QrCodeRecord;

public record ValidatedQrCode(
        QrCodeRecord qrCodeRecord,
        QrCodePayload payload
) {}

