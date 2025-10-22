package de.lunchrunner.backend.service;

import de.lunchrunner.backend.model.order.OrderItemSnapshot;

import java.math.BigDecimal;
import java.util.List;

public record OrderCalculationResult(List<OrderItemSnapshot> items, BigDecimal totalPriceGross, String currencyCode) {
}
