package com.smartattendance.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalTime;


@Getter
@Setter
@Entity
@Table(name = "organisations")
public class Organisation extends BaseEntity implements Serializable {

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String location;

    private Double latitude;

    private Double longitude;

    @Column(nullable = false, unique = true)
    private String contactEmail;

    @Column
    private String contactPhone;

    @Column
    private LocalTime startWorkTime = LocalTime.of(8,15);

    // The super admin who created this organization
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private Users createdBy;
}
