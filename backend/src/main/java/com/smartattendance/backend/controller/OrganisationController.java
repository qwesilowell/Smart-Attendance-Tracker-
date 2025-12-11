package com.smartattendance.backend.controller;

import com.smartattendance.backend.dto.OrganisationResponse;
import com.smartattendance.backend.entity.Organisation;
import com.smartattendance.backend.service.OrganisationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/organisations")
@RequiredArgsConstructor
@Slf4j
public class OrganisationController {

    private final OrganisationService organisationService;

    /**
     * Create a new organisation
     * (SuperAdmin only - add security later)
     * POST /api/organisations
     */
    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> createOrganisation(@RequestBody Organisation organisation
                                                ) {
        Organisation saved = organisationService.save(organisation);
        log.info("SuperAdmin created organisation: {}", saved.getName());

        OrganisationResponse response = OrganisationResponse.fromEntity(saved);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true,
                "message", "Organisation created successfully",
                "data", response
        ));
    }

    /**
     * Get all active organisations
     * (SuperAdmin uses this for the dropdown)
     * GET /api/organisations
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getAllOrganisations() {
        List<Organisation> organisations = organisationService.getAllActiveOrganisations();

        List<OrganisationResponse> responses = organisations.stream()
                .map(OrganisationResponse::fromEntity)
                .toList();

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Organisations fetched successfully",
                "count", responses.size(),
                "data", responses
        ));
    }

    /**
     * Get a specific organisation by ID
     * GET /api/organisations/5
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getOrganisationById(@PathVariable Long id) {
        Organisation organisation = organisationService.findById(id);

        OrganisationResponse response = OrganisationResponse.fromEntity(organisation);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Organisation retrieved successfully",
                "data", response
        ));
    }

    /**
     * Update an organisation
     * PUT /api/organisations/5
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> updateOrganisation(
            @PathVariable Long id,
            @RequestBody Organisation org
    ) {
        Organisation updated = organisationService.updateOrganisation(id, org);
        log.info("SuperAdmin updated organisation: {}", updated.getName());

        OrganisationResponse response = OrganisationResponse.fromEntity(updated);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Organisation updated successfully",
                "data", response
        ));
    }

    /**
     * Soft delete an organisation
     * DELETE /api/organisations/5
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> softDeleteOrganisation(@PathVariable Long id) {
        Organisation deleted = organisationService.softDeleteOrganisation(id);
        log.info("SuperAdmin deleted organisation: {}", deleted.getName());

        OrganisationResponse response = OrganisationResponse.fromEntity(deleted);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Organisation deleted successfully",
                "data", response
        ));
    }

    // GET /api/organisations/worktime/{orgId}
    @GetMapping("/worktime/{orgId}")
    public ResponseEntity<LocalTime> getStartWorkTime(@PathVariable Long orgId) {
        LocalTime startTime = organisationService.getDefaultStartTime(orgId);
        return ResponseEntity.ok(startTime);
    }

    // PUT /api/organisations/worktime/{orgId}
    @PutMapping("/worktime/{orgId}")
    public ResponseEntity<OrganisationResponse> updateStartWorkTime(
            @PathVariable Long orgId,
            @RequestBody LocalTime newStartTime) {

        Organisation updatedOrg = organisationService.updateStartWorkTime(orgId, newStartTime);

        OrganisationResponse response = OrganisationResponse.fromEntity(updatedOrg);

        return ResponseEntity.ok(response);
    }
}