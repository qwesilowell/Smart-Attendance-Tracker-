package com.smartattendance.backend.enums;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Defines user roles for access control in the Smart Attendance system.
 */
public enum RoleType {
    /** Highest privilege role with full system access. */
    SUPER_ADMIN,
    /** Administrative role with elevated permissions. */
    ADMIN,
    /** Standard user role with basic access. */
    USER;

    @JsonValue
    public String getValue() {
        return name();
    }
}
