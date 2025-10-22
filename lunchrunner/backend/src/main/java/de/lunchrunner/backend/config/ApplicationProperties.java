package de.lunchrunner.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "lunchrunner")
public class ApplicationProperties {

    private String environment = "production";
    private String corsOrigin = "https://lunchrunner.de";
    private String clerkPublishableKey;
    private String clerkSecretKey;
    private String clerkIssuerUrl;
    private String clerkJwtAudience;
    private String clerkJwtTemplate;
    private String clerkApiBaseUrl = "https://api.clerk.com";
    private String clerkAdminRole = "admin";
    private String clerkSignInUrl;
    private String clerkSignUpUrl;
    private int socketIoPort = 3300;
    private String socketIoPath = "/socket.io";
    private boolean socketIoEnabled = true;

    public String getEnvironment() {
        return environment;
    }

    public void setEnvironment(String environment) {
        this.environment = environment;
    }

    public String getCorsOrigin() {
        return corsOrigin;
    }

    public void setCorsOrigin(String corsOrigin) {
        this.corsOrigin = corsOrigin;
    }

    public String getClerkPublishableKey() {
        return clerkPublishableKey;
    }

    public void setClerkPublishableKey(String clerkPublishableKey) {
        this.clerkPublishableKey = clerkPublishableKey;
    }

    public String getClerkSecretKey() {
        return clerkSecretKey;
    }

    public void setClerkSecretKey(String clerkSecretKey) {
        this.clerkSecretKey = clerkSecretKey;
    }

    public String getClerkIssuerUrl() {
        return clerkIssuerUrl;
    }

    public void setClerkIssuerUrl(String clerkIssuerUrl) {
        this.clerkIssuerUrl = clerkIssuerUrl;
    }

    public String getClerkJwtAudience() {
        return clerkJwtAudience;
    }

    public void setClerkJwtAudience(String clerkJwtAudience) {
        this.clerkJwtAudience = clerkJwtAudience;
    }

    public String getClerkJwtTemplate() {
        return clerkJwtTemplate;
    }

    public void setClerkJwtTemplate(String clerkJwtTemplate) {
        this.clerkJwtTemplate = clerkJwtTemplate;
    }

    public String getClerkApiBaseUrl() {
        return clerkApiBaseUrl;
    }

    public void setClerkApiBaseUrl(String clerkApiBaseUrl) {
        this.clerkApiBaseUrl = clerkApiBaseUrl;
    }

    public String getClerkAdminRole() {
        return clerkAdminRole;
    }

    public void setClerkAdminRole(String clerkAdminRole) {
        this.clerkAdminRole = clerkAdminRole;
    }

    public String getClerkSignInUrl() {
        return clerkSignInUrl;
    }

    public void setClerkSignInUrl(String clerkSignInUrl) {
        this.clerkSignInUrl = clerkSignInUrl;
    }

    public String getClerkSignUpUrl() {
        return clerkSignUpUrl;
    }

    public void setClerkSignUpUrl(String clerkSignUpUrl) {
        this.clerkSignUpUrl = clerkSignUpUrl;
    }

    public int getSocketIoPort() {
        return socketIoPort;
    }

    public void setSocketIoPort(int socketIoPort) {
        this.socketIoPort = socketIoPort;
    }

    public String getSocketIoPath() {
        return socketIoPath;
    }

    public void setSocketIoPath(String socketIoPath) {
        this.socketIoPath = socketIoPath;
    }

    public boolean isSocketIoEnabled() {
        return socketIoEnabled;
    }

    public void setSocketIoEnabled(boolean socketIoEnabled) {
        this.socketIoEnabled = socketIoEnabled;
    }
}
