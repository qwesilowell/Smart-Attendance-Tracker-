package com.smartattendance.backend.security;

import com.smartattendance.backend.entity.Users;
import com.smartattendance.backend.enums.RoleType;
import com.smartattendance.backend.enums.UserStatus;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

@Getter
public class CustomUserDetails implements UserDetails {

    private final Long id;
    private final String email;
    private final String password;
    private final RoleType role;
    private final Long organisationId;
    private final boolean enabled;
    private final UserStatus status;

    @Setter
    private Long currentOrganisationId;

    public CustomUserDetails(Users user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.password = user.getPassword();
        this.role = user.getRole();
        this.organisationId = user.getOrganisation() != null ?
                user.getOrganisation().getId() : null;
        this.enabled = !user.isDeleted();
        this.status = user.getStatus();
        this.currentOrganisationId = null;
    }

    public boolean isSuperAdmin() {
        return role == RoleType.SUPER_ADMIN;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        System.out.println("Granting authority: ROLE_" + role.name());
        return Collections.singletonList(
                new SimpleGrantedAuthority("ROLE_" + role.name())
        );
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return status == UserStatus.ACTIVE;
    }

    @Override
    public boolean isAccountNonLocked() {
        return status != UserStatus.INACTIVE; // you can adjust this logic if needed
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return status == UserStatus.ACTIVE;
    }

    @Override
    public boolean isEnabled() {
        return status == UserStatus.ACTIVE;
    }
}
