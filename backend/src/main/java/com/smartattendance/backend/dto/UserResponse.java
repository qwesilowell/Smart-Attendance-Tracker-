package com.smartattendance.backend.dto;

import com.smartattendance.backend.entity.Users;

import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        String role,
        Long organisationId,
        String organisationName,
        LocalDateTime createdAt

) {
    public static UserResponse fromEntity(Users user) {
        return new UserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getRole().name(),
                user.getOrganisation() != null ? user.getOrganisation().getId() : null,
                user.getOrganisation() != null ? user.getOrganisation().getName() : null,
                user.getCreatedAt()
        );
    }
}

