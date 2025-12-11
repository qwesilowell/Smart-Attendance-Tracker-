package com.smartattendance.backend.service;

import com.smartattendance.backend.dto.LoginRequest;
import com.smartattendance.backend.dto.LoginResponse;
import com.smartattendance.backend.entity.Users;
import com.smartattendance.backend.repository.UserRepository;
import com.smartattendance.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    /**
     * Authenticate user and generate JWT token
     */
    public LoginResponse login(LoginRequest request) {
        log.info("Login attempt for email: {}", request.getEmail());

        // 1. Authenticate using Spring Security
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        // 2. Load user from database
        Users user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 3. Update last login time
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        // 4. Generate JWT token
        String token = jwtUtil.generateToken(user);

        // 5. Build response
        log.info("Login successful for user: {} with role: {}",
                user.getEmail(), user.getRole());

        return LoginResponse.builder()
                .token(token)
                .type("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .organisationId(user.getOrganisation() != null ?
                        user.getOrganisation().getId() : null)
                .organisationName(user.getOrganisation() != null ?
                        user.getOrganisation().getName() : null)
                .expiresIn(7200000L)
                .build();
    }
}