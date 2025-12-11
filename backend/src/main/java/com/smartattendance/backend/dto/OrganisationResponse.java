package com.smartattendance.backend.dto;

import com.smartattendance.backend.entity.Organisation;

import java.time.LocalTime;

public record OrganisationResponse(
        Long id,
        String name,
        String location,
        Double latitude,
        Double longitude,
        String contactEmail,
        String contactPhone,
        LocalTime startWorkTime,
        String createdByEmail
) {
    public static OrganisationResponse fromEntity(Organisation org) {
        return new OrganisationResponse(
                org.getId(),
                org.getName(),
                org.getLocation(),
                org.getLatitude(),
                org.getLongitude(),
                org.getContactEmail(),
                org.getContactPhone(),
                org.getStartWorkTime(),
                org.getCreatedBy() != null ? org.getCreatedBy().getEmail() : null
        );
    }


}



