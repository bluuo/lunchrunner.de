package de.lunchrunner.backend.web.dto;

import de.lunchrunner.backend.model.options.OptionsDefinition;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record ProductResponse(
        String id,
        String productName,
        String productDescription,
        BigDecimal productPriceGross,
        String currencyCode,
        String productCategory,
        boolean productActive,
        OptionsDefinition optionsDefinition,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
