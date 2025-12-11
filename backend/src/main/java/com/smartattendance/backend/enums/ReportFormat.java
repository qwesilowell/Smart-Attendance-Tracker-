package com.smartattendance.backend.enums;

import org.springframework.http.MediaType;

public enum ReportFormat {
    CSV(MediaType.parseMediaType("text/csv")),
    PDF(MediaType.APPLICATION_PDF);

    private final MediaType mediaType;

    ReportFormat(MediaType mediaType) {
        this.mediaType = mediaType;
    }

    public MediaType mediaType() {
        return mediaType;
    }

    public String extension() {
        return name().toLowerCase();
    }

    public static ReportFormat from(String value) {
        if (value == null) {
            return CSV;
        }

        try {
            return ReportFormat.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return CSV;
        }
    }
}

