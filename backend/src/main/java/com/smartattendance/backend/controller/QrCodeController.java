package com.smartattendance.backend.controller;

import com.smartattendance.backend.dto.QrCodeRequest;
import com.smartattendance.backend.dto.QrCodeResponse;
import com.smartattendance.backend.dto.QrStatusResponse;
import com.smartattendance.backend.entity.QrCodeRecord;
import com.smartattendance.backend.entity.Users;
import com.smartattendance.backend.exception.ResourceNotFoundException;
import com.smartattendance.backend.security.CustomUserDetails;
import com.smartattendance.backend.service.QrCodeImageService;
import com.smartattendance.backend.service.QrCodeService;
import com.smartattendance.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/qr-codes")
@RequiredArgsConstructor
public class QrCodeController {

    private final QrCodeService qrCodeService;
    private final QrCodeImageService qrCodeImageService;
    private final UserService userService;  // To fetch full User entity

    // Start auto-generation
    @PostMapping("/start")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<QrCodeResponse> startQrGeneration(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody @Valid QrCodeRequest request) {

        Users admin = getUserFromCustomUserDetails(userDetails);
        QrCodeRecord qrCode = qrCodeService.startAutoGeneration(admin, request);

        return ResponseEntity.ok(buildQrCodeResponse(qrCode));
    }

    // Get current active QR code
    @GetMapping("/current")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<QrCodeResponse> getCurrentQrCode(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Users admin = getUserFromCustomUserDetails(userDetails);
        QrCodeRecord qrCode = qrCodeService.getCurrentActiveQrCode(admin.getOrganisation());

        return ResponseEntity.ok(buildQrCodeResponse(qrCode));
    }

    // Stop auto-generation
    @PostMapping("/stop")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> stopQrGeneration(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Users admin = getUserFromCustomUserDetails(userDetails);
        qrCodeService.stopAutoGeneration(admin);

        return ResponseEntity.noContent().build();
    }

    // Check status
    @GetMapping("/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<QrStatusResponse> getQrStatus(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Users admin = getUserFromCustomUserDetails(userDetails);
        boolean isActive = qrCodeService.isAutoGenerating(admin.getOrganisation());

        QrStatusResponse response = QrStatusResponse.builder()
                .isAutoGenerating(isActive)
                .build();

        if (isActive) {
            QrCodeRecord qrCode = qrCodeService.getCurrentActiveQrCode(admin.getOrganisation());
            response.setCurrentQrCode(buildQrCodeResponse(qrCode));
        }

        return ResponseEntity.ok(response);
    }

    // Helper method to get full User entity from CustomUserDetails
    private Users getUserFromCustomUserDetails(CustomUserDetails userDetails) {
        return userService.findById(userDetails.getId());
    }

    private QrCodeResponse buildQrCodeResponse(QrCodeRecord qrCode) {
        String payload = qrCodeService.buildPayload(qrCode);
        String qrCodeImage = qrCodeImageService.generateQrCodeImage(payload);

        return QrCodeResponse.builder()
                .qrCodeId(qrCode.getId())
                .organisationId(qrCode.getOrganisation().getId())
                .payload(payload)
                .signature(qrCode.getSignature())
                .qrCodeImage(qrCodeImage)
                .expiresAt(qrCode.getExpiresAt())
                .latitude(qrCode.getLatitude())
                .longitude(qrCode.getLongitude())
                .radiusMeters(qrCode.getRadiusMeters())
                .scanCount(qrCode.getScanCount())
                .build();
    }
}