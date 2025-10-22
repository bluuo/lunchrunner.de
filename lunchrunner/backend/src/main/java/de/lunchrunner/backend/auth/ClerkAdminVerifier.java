package de.lunchrunner.backend.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.source.RemoteJWKSet;
import com.nimbusds.jose.proc.JWSKeySelector;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.proc.ConfigurableJWTProcessor;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;
import de.lunchrunner.backend.config.ApplicationProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.text.ParseException;
import java.time.Duration;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Component
public class ClerkAdminVerifier {

    private static final Logger LOGGER = LoggerFactory.getLogger(ClerkAdminVerifier.class);

    private final ApplicationProperties properties;
    private final ConfigurableJWTProcessor<SecurityContext> jwtProcessor;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public ClerkAdminVerifier(ApplicationProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.jwtProcessor = buildJwtProcessor(properties);
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    public ClerkSession assertAdmin(String authorizationHeader) {
        String token = parseToken(authorizationHeader);
        if (properties.getClerkIssuerUrl() == null || properties.getClerkIssuerUrl().isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Clerk issuer URL not configured");
        }
        try {
            JWTClaimsSet claims = jwtProcessor.process(token, null);
            if (claims.getIssuer() == null || !claims.getIssuer().equals(properties.getClerkIssuerUrl())) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid authorization token");
            }
            if (properties.getClerkJwtAudience() != null && !properties.getClerkJwtAudience().isBlank()) {
                Set<String> allowedAudience = java.util.Arrays.stream(properties.getClerkJwtAudience().split(","))
                        .map(String::trim)
                        .filter(entry -> !entry.isEmpty())
                        .collect(java.util.stream.Collectors.toSet());
                if (!allowedAudience.isEmpty() && claims.getAudience().stream().noneMatch(allowedAudience::contains)) {
                    throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid authorization token");
                }
            }
            String userId = Optional.ofNullable(claims.getSubject())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token missing subject"));
            if (hasAdminRole(claims)) {
                return buildSession(claims, token);
            }
            if (properties.getClerkSecretKey() == null || properties.getClerkSecretKey().isBlank()) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Administrator permissions required");
            }
            if (fetchUserHasAdminRole(userId)) {
                return buildSession(claims, token);
            }
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Administrator permissions required");
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (ParseException | JOSEException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid authorization token");
        }
    }

    private ClerkSession buildSession(JWTClaimsSet claims, String token) {
        String email = Optional.ofNullable(tryGetStringClaim(claims, "email"))
                .orElseGet(() -> tryGetStringClaim(claims, "email_address"));
        String sessionId = tryGetStringClaim(claims, "sid");
        return new ClerkSession(claims.getSubject(), sessionId, email);
    }

    private boolean fetchUserHasAdminRole(String userId) {
        try {
            URI uri = buildUserUri(userId);
            HttpRequest request = HttpRequest.newBuilder(uri)
                    .GET()
                    .timeout(Duration.ofSeconds(5))
                    .header("Authorization", "Bearer " + properties.getClerkSecretKey())
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 404) {
                return false;
            }
            if (response.statusCode() >= 400) {
                LOGGER.warn("Failed to fetch Clerk user profile: status {}", response.statusCode());
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to verify administrator permissions");
            }
            JsonNode node = objectMapper.readTree(response.body());
            return hasAdminMetadata(node.path("public_metadata")) || hasAdminMetadata(node.path("private_metadata"));
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to verify administrator permissions");
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to verify administrator permissions");
        }
    }

    private URI buildUserUri(String userId) {
        try {
            String base = Optional.ofNullable(properties.getClerkApiBaseUrl()).orElse("https://api.clerk.com");
            if (!base.endsWith("/")) {
                base = base + "/";
            }
            return new URI(base + "v1/users/" + userId);
        } catch (URISyntaxException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Invalid Clerk API URL");
        }
    }

    private boolean hasAdminRole(JWTClaimsSet claims) throws ParseException {
        String adminRole = properties.getClerkAdminRole();
        if (adminRole == null || adminRole.isBlank()) {
            adminRole = "admin";
        }
        if ("admin".equalsIgnoreCase(claims.getStringClaim("role"))) {
            return true;
        }
        if (adminRole.equals(claims.getStringClaim("org_role"))) {
            return true;
        }
        JsonNode publicMetadata = toJsonNode(claims.getJSONObjectClaim("public_metadata"));
        JsonNode privateMetadata = toJsonNode(claims.getJSONObjectClaim("private_metadata"));
        JsonNode unsafeMetadata = toJsonNode(claims.getJSONObjectClaim("unsafe_metadata"));
        return hasAdminMetadata(publicMetadata) || hasAdminMetadata(privateMetadata) || hasAdminMetadata(unsafeMetadata);
    }

    private String tryGetStringClaim(JWTClaimsSet claims, String name) {
        try {
            return claims.getStringClaim(name);
        } catch (ParseException ex) {
            return null;
        }
    }

    private JsonNode toJsonNode(Map<String, Object> metadata) {
        if (metadata == null) {
            return objectMapper.nullNode();
        }
        return objectMapper.valueToTree(metadata);
    }

    private boolean hasAdminMetadata(JsonNode metadata) {
        if (metadata == null || metadata.isMissingNode() || metadata.isNull()) {
            return false;
        }
        if (metadata.path("isAdmin").asBoolean(false)) {
            return true;
        }
        String adminRole = Optional.ofNullable(properties.getClerkAdminRole()).filter(role -> !role.isBlank()).orElse("admin");
        if (metadata.path("role").asText(" ").equals(adminRole)) {
            return true;
        }
        if (metadata.has("roles")) {
            for (JsonNode roleNode : metadata.path("roles")) {
                if (adminRole.equals(roleNode.asText())) {
                    return true;
                }
            }
        }
        return false;
    }

    private String parseToken(String header) {
        if (header == null || header.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authorization header with Bearer token is required");
        }
        if (!header.toLowerCase().startsWith("bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authorization header with Bearer token is required");
        }
        return header.substring("bearer ".length()).trim();
    }

    private ConfigurableJWTProcessor<SecurityContext> buildJwtProcessor(ApplicationProperties properties) {
        try {
            URL jwksUrl = new URL(properties.getClerkIssuerUrl().replaceAll("/+$", "") + "/.well-known/jwks.json");
            ConfigurableJWTProcessor<SecurityContext> processor = new DefaultJWTProcessor<>();
            JWSAlgorithm expectedJwsAlgorithm = JWSAlgorithm.RS256;
            JWSKeySelector<SecurityContext> keySelector = new JWSVerificationKeySelector<>(expectedJwsAlgorithm, new RemoteJWKSet<>(jwksUrl));
            processor.setJWSKeySelector(keySelector);
            return processor;
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to configure Clerk JWT processor", ex);
        }
    }
}
