package de.lunchrunner.backend.auth;

public record ClerkSession(String userId, String sessionId, String email) {
}
