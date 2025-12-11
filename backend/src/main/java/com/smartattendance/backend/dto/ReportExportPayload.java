package com.smartattendance.backend.dto;

import org.springframework.http.MediaType;

public record ReportExportPayload(
        byte[] content,
        String fileName,
        MediaType mediaType
) {}

