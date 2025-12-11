package com.smartattendance.backend.service;

import com.smartattendance.backend.entity.Organisation;
import com.smartattendance.backend.entity.Users;
import com.smartattendance.backend.exception.ResourceNotFoundException;
import com.smartattendance.backend.repository.OrganisationRepository;
import com.smartattendance.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrganisationService {
    private final OrganisationRepository organisationRepository;
    private final UserRepository userRepository;

    private static final double DEFAULT_LATITUDE = 5.631155029146822;
    private static final double DEFAULT_LONGITUDE = -0.22219213171956173;

    // OrganisationService.java
    @Transactional
    public Organisation save(Organisation organisation) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String userEmail;
        if (principal instanceof UserDetails userDetails) {
            userEmail = userDetails.getUsername();
        } else {
            userEmail = principal.toString();
        }
        Users creator = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Authenticated Super Admin user not found in database."));

        if (creator == null) {
            throw new RuntimeException("Authenticated Super Admin user not found in database.");
        }
        organisation.setCreatedBy(creator);

        if (organisation.getStartWorkTime() == null) {
            organisation.setStartWorkTime(LocalTime.of(8, 15)); // Use your default time
        }

        if (organisation.getLatitude() == null) {
            organisation.setLatitude(DEFAULT_LATITUDE);
        }
        if (organisation.getLongitude() == null) {
            organisation.setLongitude(DEFAULT_LONGITUDE);
        }

        return organisationRepository.save(organisation);
    }

    public List<Organisation> getAllActiveOrganisations() {
        return organisationRepository.findByDeletedFalse();
    }

    public List<Organisation> findOrganisations() {
        return organisationRepository.findAll();
    }

    public Organisation findById(Long id) {
        return organisationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Organisation not found"));
    }

    public Organisation softDeleteOrganisation(Long id) {
        Organisation organisation = organisationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Organisation not found"));

        organisation.setDeleted(true); // mark as deleted
        return organisationRepository.save(organisation); // save updates only the deleted flag
    }

    public Organisation updateOrganisation(Long id, Organisation updatedOrg) {
        Organisation existing = organisationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Organisation not found"));

        existing.setName(updatedOrg.getName());
        existing.setLocation(updatedOrg.getLocation());
        existing.setContactEmail(updatedOrg.getContactEmail());
        existing.setContactPhone(updatedOrg.getContactPhone());
        if (updatedOrg.getLatitude() != null) {
            existing.setLatitude(updatedOrg.getLatitude());
        }
        if (updatedOrg.getLongitude() != null) {
            existing.setLongitude(updatedOrg.getLongitude());
        }
        return organisationRepository.save(existing);
    }

    public LocalTime getDefaultStartTime(Long organisationId) {
        return organisationRepository.findById(organisationId)
                .map(Organisation::getStartWorkTime)
                .orElseThrow(() -> new ResourceNotFoundException("Organisation not found"));
    }

    @Transactional
    public Organisation updateStartWorkTime(Long organisationId, LocalTime newStartTime) {
        // 1. Find the Organisation by ID
        Organisation organisation = organisationRepository.findById(organisationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organisation not found"));

        // 2. Update the field and save
        organisation.setStartWorkTime(newStartTime);
        return organisationRepository.save(organisation);
    }

}
