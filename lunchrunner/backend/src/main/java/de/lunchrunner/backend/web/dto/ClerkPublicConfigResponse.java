package de.lunchrunner.backend.web.dto;

public record ClerkPublicConfigResponse(
        String publishableKey,
        String signInUrl,
        String signUpUrl,
        String jwtTemplate
) {
}
