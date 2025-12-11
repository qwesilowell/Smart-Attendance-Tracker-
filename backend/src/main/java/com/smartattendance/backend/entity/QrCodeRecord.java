package com.smartattendance.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;

import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "qr_code_records")
public class QrCodeRecord extends BaseEntity implements Serializable {

    @Column(nullable = false, unique = true, length = 128)
    private String code;

    @Column(length = 2048)
    private String payload;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organisation_id", nullable = false)
    private Organisation organisation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_admin_id", nullable = false)
    private Users createdBy;

    private Double latitude;
    private Double longitude;

    private Integer radiusMeters = 100;

    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(nullable = false)
    @Builder.Default
    private boolean isAutoGenerating = false;

    @Column(nullable = false)
    @ColumnDefault("0")
    @Builder.Default
    private Integer scanCount = 0;

    @Column(length = 128)
    private String signature;
}

