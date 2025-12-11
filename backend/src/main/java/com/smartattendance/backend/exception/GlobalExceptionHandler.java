package com.smartattendance.backend.exception;

import com.smartattendance.backend.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(LocationValidationException.class)
    public ResponseEntity<ApiResponse<Void>> handleLocation(LocationValidationException ex) {
        log.warn("Location validation failed: {}", ex.getMessage());
        return ResponseEntity.badRequest()
                .body(ApiResponse.failure(ex.getMessage(), "LOCATION_VALIDATION_ERROR"));
    }

    @ExceptionHandler(InvalidSignatureException.class)
    public ResponseEntity<ApiResponse<Void>> handleSignature(InvalidSignatureException ex) {
        log.warn("QR signature invalid: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.failure(ex.getMessage(), "INVALID_QR_SIGNATURE"));
    }

    @ExceptionHandler(QrCodeException.class)
    public ResponseEntity<ApiResponse<Void>> handleQr(QrCodeException ex) {
        log.warn("QR code error: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.failure(ex.getMessage(), "QR_CODE_ERROR"));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(ResourceNotFoundException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.failure(ex.getMessage(), "RESOURCE_NOT_FOUND"));
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnauthorized(UnauthorizedException ex) {
        log.warn("Unauthorized request: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.failure(ex.getMessage(), "UNAUTHORIZED"));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<Void>> handleRuntime(RuntimeException ex) {
        log.error("Unexpected error", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.failure("An unexpected error occurred", "SERVER_ERROR"));
    }
}

