package com.smartattendance.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class QrCodeResponse {
    private Long qrCodeId;
    private Long organisationId;
    private String payload;
    private String signature;
    private String qrCodeImage;
    private LocalDateTime expiresAt;
    private Double latitude;
    private Double longitude;
    private Integer radiusMeters;
    private Integer scanCount;
}