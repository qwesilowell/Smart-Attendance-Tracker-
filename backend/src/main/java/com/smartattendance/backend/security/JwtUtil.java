package com.smartattendance.backend.security;

import com.smartattendance.backend.entity.Users;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
@Slf4j
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long expiration;

    /**
     * Generate JWT token from user details
     */
    public String generateToken(Users user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);

        return Jwts.builder()
                .subject(user.getEmail()) // Who the token is for
                .claim("userId", user.getId())
                .claim("role", user.getRole().name())
                .claim("organisationId", user.getOrganisation() != null ?
                        user.getOrganisation().getId() : null)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey(), Jwts.SIG.HS256)
                .compact();
    }

    /**
     * Generate JWT token with specific organisation
     * Used when SuperAdmin selects an organisation to work in
     */
    public String generateTokenWithOrg(Users user, Long currentOrgId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expiration);

        return Jwts.builder()
                .subject(user.getEmail())
                .claim("userId", user.getId())
                .claim("role", user.getRole().name())
                .claim("organisationId", user.getOrganisation() != null ?
                        user.getOrganisation().getId() : null)
                .claim("currentOrganisationId", currentOrgId) // Add selected org
                .issuedAt(now)
                .expiration(expiry)
                .signWith(getSigningKey(), Jwts.SIG.HS256)
                .compact();
    }


    /**
     * Get email from JWT token
     */
    public String getEmailFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        return claims.getSubject();
    }

    /**
     * Get user ID from JWT token
     */
    public Long getUserIdFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        return claims.get("userId", Long.class);
    }

    /**
     * Get role from JWT token
     */
    public String getRoleFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        return claims.get("role", String.class);
    }

    /**
     * Get organisation ID from JWT token
     */
    public Long getOrganisationIdFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        return claims.get("organisationId", Long.class);
    }

    /**
     * Get SuperAdmin's currently selected organisation ID from token
     */
    public Long getCurrentOrganisationIdFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        return claims.get("currentOrganisationId", Long.class);
    }

    /**
     * Get the effective organisation ID (for queries)
     * Returns currentOrganisationId if present, otherwise organisationId
     */
    public Long getEffectiveOrganisationId(String token) {
        Claims claims = getClaimsFromToken(token);

        // Check for currentOrganisationId first (SuperAdmin viewing specific org)
        if (claims.containsKey("currentOrganisationId")) {
            return claims.get("currentOrganisationId", Long.class);
        }

        // Fallback to user's actual organisationId
        return claims.get("organisationId", Long.class);
    }

    /**
     * Validate JWT token
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (SecurityException ex) {
            log.error("Invalid JWT signature");
        } catch (MalformedJwtException ex) {
            log.error("Invalid JWT token");
        } catch (ExpiredJwtException ex) {
            log.error("Expired JWT token");
        } catch (UnsupportedJwtException ex) {
            log.error("Unsupported JWT token");
        } catch (IllegalArgumentException ex) {
            log.error("JWT claims string is empty");
        }
        return false;
    }

    /**
     * Extract all claims from token
     */
    public Claims getClaimsFromToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Get signing key for JWT
     */
    private SecretKey getSigningKey() {
        byte[] keyBytes = hexStringToByteArray(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private byte[] hexStringToByteArray(String hex) {
        int len = hex.length();
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(hex.charAt(i), 16) << 4)
                    + Character.digit(hex.charAt(i + 1), 16));
        }
        return data;
    }
}