package com.smartattendance.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class QrCodeRequest {
    private Double latitude;
    private Double longitude;

    @Min(10)
    @Max(1000)
    private Integer radiusMeters = 100;
}
