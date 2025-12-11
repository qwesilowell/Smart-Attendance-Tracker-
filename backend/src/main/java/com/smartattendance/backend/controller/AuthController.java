package com.smartattendance.backend.controller;

import com.smartattendance.backend.dto.LoginRequest;
import com.smartattendance.backend.dto.LoginResponse;
import com.smartattendance.backend.entity.Organisation;
import com.smartattendance.backend.entity.Users;
import com.smartattendance.backend.repository.OrganisationRepository;
import com.smartattendance.backend.repository.UserRepository;
import com.smartattendance.backend.security.CustomUserDetails;
import com.smartattendance.backend.security.JwtUtil;
import com.smartattendance.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class AuthController {

    private final AuthService authService;
    private final OrganisationRepository organisationRepository;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            LoginResponse response = authService.login(request);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Login successful",
                    "data", response
            ));

        } catch (BadCredentialsException e) {
            log.warn("Failed login attempt for email: {}", request.getEmail());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "success", false,
                    "message", "Invalid email or password"
            ));
        } catch (Exception e) {
            log.error("Login error for email: {}", request.getEmail(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "success", false,
                    "message", "Login failed. Please try again."
            ));
        }
    }

    /**
     * SuperAdmin selects which organisation to work with
     * Generates a new token with the selected organisation context
     * PUT /api/auth/select-organisation/{orgId}
     */
    @PutMapping("/select-organisation/{orgId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> selectOrganisation(
            @PathVariable Long orgId,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        log.info("SuperAdmin {} selecting organisation {}", currentUser.getEmail(), orgId);

        // Validate organisation exists
        Organisation org = organisationRepository.findByIdAndDeletedFalse(orgId)
                .orElseThrow(() -> new RuntimeException("Organisation not found"));

        // Load user from database
        Users superAdmin = userRepository.findByIdAndDeletedFalse(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Generate NEW token with selected organisation
        String newToken = jwtUtil.generateTokenWithOrg(superAdmin, org.getId());

        // Build response
        LoginResponse response = LoginResponse.builder()
                .token(newToken)
                .type("Bearer")
                .userId(superAdmin.getId())
                .email(superAdmin.getEmail())
                .firstName(superAdmin.getFirstName())
                .lastName(superAdmin.getLastName())
                .role(superAdmin.getRole())
                .organisationId(superAdmin.getOrganisation() != null ?
                        superAdmin.getOrganisation().getId() : null)
                .organisationName(org.getName()) // The selected org
                .expiresIn(7200000L)
                .build();

        log.info("SuperAdmin {} switched to organisation: {}", currentUser.getEmail(), org.getName());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Organisation switched successfully",
                "data", response
        ));
    }
}