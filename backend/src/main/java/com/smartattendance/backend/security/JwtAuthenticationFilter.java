package com.smartattendance.backend.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService customUserDetailsService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String jwt = getJwtFromRequest(request);

        // Check if token exists and is valid before processing
        if (StringUtils.hasText(jwt) && jwtUtil.validateToken(jwt)) {
            try {
                String email = jwtUtil.getEmailFromToken(jwt);

                // Load base user details (this is where DisabledException might occur)
                UserDetails userDetails = customUserDetailsService.loadUserByUsername(email);

                // === ADD CURRENT ORG FROM JWT ===
                Claims claims = jwtUtil.getClaimsFromToken(jwt);
                Long currentOrgId = claims.containsKey("currentOrganisationId")
                        ? claims.get("currentOrganisationId", Long.class)
                        : null;

                // If CustomUserDetails, set current org
                if (userDetails instanceof CustomUserDetails customDetails) {
                    customDetails.setCurrentOrganisationId(currentOrgId);
                }

                // Create and set authentication
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities()
                        );
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
                log.debug("Authenticated user: {} | Current Org ID: {}", email, currentOrgId);

            } catch (Exception ex) {
                // Catch exceptions during user loading/context setup (e.g., DisabledException)
                log.error("Authentication setup failed for user with token", ex);
                // We let the request proceed with an empty context, which will be caught by
                // .anyRequest().authenticated() and result in 403/401
            }
        }

        // This is the CRITICAL step. The request proceeds. If context is empty,
        // Spring Security will reject it based on configuration.
        filterChain.doFilter(request, response);
    }

    /**
     * Extract JWT token from Authorization header
     * Header format: "Bearer <token>"
     */
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");

        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7); // Remove "Bearer " prefix
        }

        return null;
    }
}
