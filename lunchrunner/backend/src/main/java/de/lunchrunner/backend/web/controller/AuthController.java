package de.lunchrunner.backend.web.controller;

import de.lunchrunner.backend.config.ApplicationProperties;
import de.lunchrunner.backend.web.dto.ClerkPublicConfigResponse;
import de.lunchrunner.backend.web.dto.RealtimeConfigResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final ApplicationProperties properties;

    public AuthController(ApplicationProperties properties) {
        this.properties = properties;
    }

    @GetMapping("/clerk-public-config")
    public ClerkPublicConfigResponse clerkConfig() {
        return new ClerkPublicConfigResponse(
                properties.getClerkPublishableKey(),
                properties.getClerkSignInUrl(),
                properties.getClerkSignUpUrl(),
                properties.getClerkJwtTemplate()
        );
    }

    @GetMapping("/realtime-config")
    public RealtimeConfigResponse realtimeConfig(HttpServletRequest request) {
        String scheme = request.getHeader("X-Forwarded-Proto");
        if (scheme == null || scheme.isBlank()) {
            scheme = request.getScheme();
        }
        String hostHeader = request.getHeader("X-Forwarded-Host");
        String host = (hostHeader == null || hostHeader.isBlank()) ? request.getServerName() : hostHeader.split(",")[0].trim();
        if (host.contains(":")) {
            host = host.substring(0, host.indexOf(':'));
        }
        String url = String.format("%s://%s:%d", scheme, host, properties.getSocketIoPort());
        return new RealtimeConfigResponse(url, properties.getSocketIoPath(), "/realtime");
    }
}
