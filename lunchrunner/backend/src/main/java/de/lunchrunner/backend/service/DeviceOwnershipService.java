package de.lunchrunner.backend.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class DeviceOwnershipService {

    public static final String HEADER_NAME = "x-device-id";

    public UUID requireDeviceId(String headerValue) {
        if (headerValue == null || headerValue.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Header x-device-id is required");
        }
        try {
            return UUID.fromString(headerValue.trim());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Header x-device-id must be a valid UUID");
        }
    }

    public void assertOwnership(UUID deviceIdFromHeader, UUID orderDeviceId) {
        if (!orderDeviceId.equals(deviceIdFromHeader)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only modify your own orders");
        }
    }
}
