package com.smartattendance.backend.service;

import com.smartattendance.backend.dto.AdminCreateUserRequest;
import com.smartattendance.backend.dto.SuperAdminCreateUserRequest;
import com.smartattendance.backend.dto.LoginResponse;
import com.smartattendance.backend.entity.Organisation;
import com.smartattendance.backend.entity.Users;
import com.smartattendance.backend.enums.RoleType;
import com.smartattendance.backend.enums.UserStatus;
import com.smartattendance.backend.repository.UserRepository;
import com.smartattendance.backend.security.CustomUserDetails;
import com.smartattendance.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    private final UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;

    private final OrganisationService organisationService;

            // Key Principle:
    // Every operation (except login) requires an organisation.
// SuperAdmin will select which org they want to work with, and that orgId is passed to these methods.

    /**
     * Save a new user
     */
    public Users save(Users user) {
        log.info("Saving new user: {} for organisation: {}",
                user.getEmail(),
                user.getOrganisation() != null ? user.getOrganisation().getName() : "N/A");

        if (user.getPassword() != null && !user.getPassword().startsWith("$2a$")) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        return userRepository.save(user);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public Users createByAdmin(AdminCreateUserRequest req, CustomUserDetails currentAdmin) {


        Users adminUser = userRepository.findByIdAndDeletedFalse(currentAdmin.getId())
                .orElseThrow(() -> new RuntimeException("Admin not found or deleted"));

        Organisation org = adminUser.getOrganisation();
        if (org == null) {
            throw new RuntimeException("Admin has no organisation");
        }

        if (userRepository.existsByEmailAndOrganisationAndDeletedFalse(req.getEmail(), org)) {
            throw new RuntimeException("Email already in use in this organisation");
        }

        // Prevent SUPER_ADMIN creation
        if (req.getRole() == RoleType.SUPER_ADMIN) {
            throw new RuntimeException("Cannot create SUPER_ADMIN");
        }

        Users user = new Users();
        user.setFirstName(req.getFirstName());
        user.setLastName(req.getLastName());
        user.setEmail(req.getEmail());
        user.setPassword(req.getPassword()); // save() will hash
        user.setRole(req.getRole());
        user.setOrganisation(org); // SAME ORG as admin creating
        user.setStatus(UserStatus.ACTIVE);
        user.setLastLogin(LocalDateTime.now());

        return save(user);
    }

    @Transactional
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public Users createUserBySuperAdmin(SuperAdminCreateUserRequest req) {
        Long orgId = req.getOrganisationId();
        if (orgId == null) {
            throw new RuntimeException("Please select an organisation first");
        }

        Organisation org = organisationService.findById(orgId);

        if (userRepository.existsByEmailAndOrganisationAndDeletedFalse(req.getEmail(), org)) {
            throw new RuntimeException("Email already in use in this organisation");
        }

//        if (req.getRole() == RoleType.SUPER_ADMIN) {
//            throw new RuntimeException("Cannot create SUPER_ADMIN via API");
//        }

        Users user = new Users();
        user.setFirstName(req.getFirstName());
        user.setLastName(req.getLastName());
        user.setEmail(req.getEmail());
        user.setPassword(req.getPassword());
        user.setRole(req.getRole());
        user.setOrganisation(org);
        user.setStatus(UserStatus.ACTIVE);
        user.setLastLogin(LocalDateTime.now());

        return save(user);
    }

    public Users findById (Long id){
        return userRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("User not found "));
    }


    /**
     * Get all users in a specific organisation
     * Note: organisation is NEVER null in select organisation approach for admin
     */
    public List<Users> findAllUsersInOrganisation(Organisation organisation) {
        log.info("Fetching users for organisation: {}", organisation.getName());
        return userRepository.findByOrganisationAndDeletedFalse(organisation);
    }

    /**
     * Find a specific user by ID within an organisation
     */
    public Users findByIdInOrganisation(Long userId, Organisation organisation) {
        return userRepository.findByIdAndOrganisation(userId, organisation)
                .orElseThrow(() -> new RuntimeException("User not found in this organisation"));
    }

    /**
     * Find user by email within an organisation
     */
    public Users findByEmailAndOrganisation(String email, Organisation organisation) {
        return userRepository.findByEmailAndOrganisationAndDeletedFalse(email, organisation)
                .orElseThrow(() -> new RuntimeException("User not found in this organisation"));
    }

    /**
     * Search users by name within an organisation
     */
    public List<Users> searchByNameAndOrganisation(String name, Organisation organisation) {
        log.info("Searching users in organisation {} with name: {}",
                organisation.getName(), name);
        return userRepository.searchByNameAndOrganisation(name, organisation);
    }


    /**
     * Update user within an organisation
     */
    public Users updateUser(Long id, Users updatedUser, Organisation organisation) {
        Users existingUser = userRepository.findByIdAndOrganisation(id, organisation)
                .orElseThrow(() -> new RuntimeException("User not found in this organisation"));

        existingUser.setFirstName(updatedUser.getFirstName());
        existingUser.setLastName(updatedUser.getLastName());
        existingUser.setEmail(updatedUser.getEmail());
        existingUser.setRole(updatedUser.getRole());
        existingUser.setStatus(updatedUser.getStatus());
        if (updatedUser.getPassword() != null && !updatedUser.getPassword().startsWith("$2a$")) {
            existingUser.setPassword(passwordEncoder.encode(updatedUser.getPassword()));
        }

        log.info("Updating user: {} (ID: {}) in organisation: {}",
                existingUser.getEmail(), id, organisation.getName());
        return userRepository.save(existingUser);
    }

    /**
     * Soft delete user within an organisation
     */
    public Users softDeleteUser(Long userId, Organisation organisation) {
        Users user = userRepository.findByIdAndOrganisation(userId, organisation)
                .orElseThrow(() -> new RuntimeException("User not found in this organisation"));

        user.setDeleted(true);
        log.info("Soft deleting user: {} (ID: {}) in organisation: {}",
                user.getEmail(), userId, organisation.getName());
        return userRepository.save(user);
    }

    /**
     * Find user by email (used for login/authentication - no org scope)
     */
    public Users findByEmail(String email) {
        return userRepository.findByEmailAndDeletedFalse(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @EventListener(ApplicationReadyEvent.class)
    public void initSuperAdmin() {
        long userCount = userRepository.count();

        boolean superAdminExists = userRepository.existsByRole(RoleType.SUPER_ADMIN);

        if (userCount == 0 || !superAdminExists) {
            log.info("No Super Admin found — creating default Super Admin...");

            Users superAdmin = new Users();
            superAdmin.setFirstName("Philip");
            superAdmin.setLastName("Asare");
            superAdmin.setEmail("superadmin@system.com");
            superAdmin.setPassword(passwordEncoder.encode("Admin@123"));
            superAdmin.setRole(RoleType.SUPER_ADMIN);
            superAdmin.setStatus(UserStatus.ACTIVE);
            superAdmin.setLastLogin(LocalDateTime.now());

            userRepository.save(superAdmin);

            log.info("Default Super Admin created: superadmin@system.com / Admin@123");
        } else {
            log.info("Super Admin already exists — skipping creation.");
        }
    }
}
