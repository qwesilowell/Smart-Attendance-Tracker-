package com.smartattendance.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class QrStatusResponse {
    private boolean isAutoGenerating;
    private QrCodeResponse currentQrCode;
}
