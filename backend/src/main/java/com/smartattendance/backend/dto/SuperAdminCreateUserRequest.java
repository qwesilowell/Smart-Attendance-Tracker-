package com.smartattendance.backend.dto;

import com.smartattendance.backend.enums.RoleType;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class SuperAdminCreateUserRequest {

    @NotBlank(message = "First Name cannot be empty")
    @Size(min = 2, max = 50, message = "First name must be between 2 and 50 characters")
    private String firstName;

    @NotBlank(message = "Last Name cannot be empty")
    @Size(min = 2, max = 50, message = "Last name must be between 2 and 50 characters")
    private String lastName;

    @NotBlank(message = "Email cannot be empty")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Password cannot be empty")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotNull(message = "Role is required")
    private RoleType role;

    @NotNull(message = "Organisation ID is required")
    private Long organisationId; // Super Admin chooses org
}
