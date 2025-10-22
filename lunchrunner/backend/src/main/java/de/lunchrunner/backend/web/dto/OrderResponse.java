package de.lunchrunner.backend.web.dto;

import de.lunchrunner.backend.model.order.OrderItemSnapshot;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record OrderResponse(
        String id,
        String deviceId,
        String customerName,
        List<OrderItemSnapshot> items,
        BigDecimal totalPriceGross,
        String currencyCode,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
