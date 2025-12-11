package com.smartattendance.backend.entity;

import com.smartattendance.backend.enums.RoleType;
import com.smartattendance.backend.enums.UserStatus;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "users")
public class Users extends BaseEntity implements Serializable {

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password; // store hashed password

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoleType role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id")
    private Organisation organisation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status = UserStatus.ACTIVE;

    //Add at column
    private LocalDateTime lastLogin;

    @Transient  // Means "don't save this to database"
    public String getFullName() {
        return firstName + " " + lastName;
    }
}

