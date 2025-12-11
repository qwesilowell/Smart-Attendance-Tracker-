package com.smartattendance.backend.controller;

import com.smartattendance.backend.dto.AdminCreateUserRequest;
import com.smartattendance.backend.dto.SuperAdminCreateUserRequest;
import com.smartattendance.backend.dto.UserResponse;
import com.smartattendance.backend.entity.Organisation;
import com.smartattendance.backend.entity.Users;
import com.smartattendance.backend.security.CustomUserDetails;
import com.smartattendance.backend.service.OrganisationService;
import com.smartattendance.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final OrganisationService organisationService;

    /**
     * Get all users in a specific organisation
     * SuperAdmin and OrgAdmin must provide orgId
     * GET /api/users?orgId=5
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getAllUsers(
            @RequestParam Long orgId,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        // Validate access
        validateOrganisationAccess(currentUser, orgId);

        Organisation organisation = organisationService.findById(orgId);
        List<Users> users = userService.findAllUsersInOrganisation(organisation);
        List<UserResponse> responseList = users.stream()
                .map(UserResponse::fromEntity)
                .toList();


        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Users retrieved successfully",
                "count", users.size(),
                "data", responseList
        ));
    }

    /**
     * Get a specific user by ID within an organisation
     * GET /api/users/10?orgId=5
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getUserById(
            @PathVariable Long id,
            @RequestParam Long orgId,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        validateOrganisationAccess(currentUser, orgId);

        Organisation organisation = organisationService.findById(orgId);
        Users user = userService.findByIdInOrganisation(id, organisation);

        UserResponse response = UserResponse.fromEntity(user);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "User retrieved successfully",
                "data", response
        ));
    }

    /**
     * Create a new user in a specific organisation
     * POST /api/admin/create
     * Body: { "firstName": "John", "lastName": "Doe", ... }
     */
    @PostMapping("/admin/create")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUserByAdmin(
            @RequestBody AdminCreateUserRequest request,
            @AuthenticationPrincipal CustomUserDetails currentAdmin
    ) {
        Users createdUser = userService.createByAdmin(request, currentAdmin);
        UserResponse response = UserResponse.fromEntity(createdUser);


        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true,
                "message", "User created successfully",
                "data", response
        ));
    }

    @PostMapping("/superadmin/create")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> createUserBySuperAdmin(
            @RequestBody SuperAdminCreateUserRequest request
    ) {
        Users createdUser = userService.createUserBySuperAdmin(request);
        UserResponse response = UserResponse.fromEntity(createdUser);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true,
                "message", "User created successfully",
                "data", response
        ));
    }

    /**
     * Update a user within an organisation
     * PUT /api/users/10?orgId=5
     * Body: { "firstName": "Jane", ... }
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> updateUser(
            @PathVariable Long id,
            @RequestBody Users updatedUser,
            @RequestParam Long orgId,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        validateOrganisationAccess(currentUser, orgId);

        Organisation organisation = organisationService.findById(orgId);
        Users saved = userService.updateUser(id, updatedUser, organisation);
        UserResponse response = UserResponse.fromEntity(saved);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "User updated successfully",
                "data", response
        ));
    }

    /**
     * Soft delete a user within an organisation
     * DELETE /api/users/10?orgId=5
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> deleteUser(
            @PathVariable Long id,
            @RequestParam Long orgId,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        validateOrganisationAccess(currentUser, orgId);

        Organisation organisation = organisationService.findById(orgId);
        Users deleted = userService.softDeleteUser(id, organisation);
        UserResponse response = UserResponse.fromEntity(deleted);


        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "User deleted successfully",
                "data", response
        ));
    }

    /**
     * Search users by name within an organisation
     * GET /api/users/search?name=John&orgId=5
     */
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> searchUsers(
            @RequestParam String name,
            @RequestParam Long orgId,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        validateOrganisationAccess(currentUser, orgId);

        Organisation organisation = organisationService.findById(orgId);
        List<Users> results = userService.searchByNameAndOrganisation(name, organisation);
        List<UserResponse> responseList = results.stream()
                .map(UserResponse::fromEntity)
                .toList();


        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Search completed successfully",
                "count", results.size(),
                "data", responseList
        ));
    }

    /**
     * Get user by email within an organisation
     * GET /api/users/email/john@example.com?orgId=5
     */
    @GetMapping("/email/{email}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<?> getByEmail(
            @PathVariable String email,
            @RequestParam Long orgId,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        validateOrganisationAccess(currentUser, orgId);

        Organisation organisation = organisationService.findById(orgId);
        Users user = userService.findByEmailAndOrganisation(email, organisation);
        UserResponse response = UserResponse.fromEntity(user);


        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "User retrieved successfully",
                "data", response
        ));
    }

    private void validateOrganisationAccess(CustomUserDetails currentUser, Long orgId) {
        if (currentUser.isSuperAdmin()) {
            // SuperAdmin can access any organisation
            return;
        }

        // Regular ADMIN must match their organisation
        if (!currentUser.getOrganisationId().equals(orgId)) {
            throw new RuntimeException("Access denied: You cannot access this organisation's data");
        }
    }
}