package de.lunchrunner.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.lunchrunner.backend.data.entity.ProductEntity;
import de.lunchrunner.backend.model.options.OptionGroupDefinition;
import de.lunchrunner.backend.model.options.OptionValueDefinition;
import de.lunchrunner.backend.model.options.OptionsDefinition;
import de.lunchrunner.backend.model.order.OrderItemSnapshot;
import de.lunchrunner.backend.web.dto.OrderItemRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class PriceCalculationService {

    private final OptionsValidationService optionsValidationService;
    private final ObjectMapper objectMapper;

    public PriceCalculationService(OptionsValidationService optionsValidationService, ObjectMapper objectMapper) {
        this.optionsValidationService = optionsValidationService;
        this.objectMapper = objectMapper;
    }

    public OrderCalculationResult calculate(List<ProductEntity> products, List<OrderItemRequest> items, String currencyCode) {
        BigDecimal total = BigDecimal.ZERO;
        final List<OrderItemSnapshot> snapshots = new java.util.ArrayList<>();

        for (OrderItemRequest item : items) {
            UUID productId;
            try {
                productId = UUID.fromString(item.getProductId());
            } catch (IllegalArgumentException ex) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid product id supplied");
            }
            ProductEntity product = products.stream()
                    .filter(entry -> entry.getId().equals(productId))
                    .findFirst()
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

            OptionsDefinition optionsDefinition = convertOptions(product.getOptionsDefinition());
            Map<String, Object> selectedOptions = Optional.ofNullable(item.getSelectedOptions()).orElseGet(HashMap::new);
            optionsValidationService.validateSelection(optionsDefinition, selectedOptions);

            BigDecimal optionsPrice = calculateOptionsPrice(optionsDefinition, selectedOptions);
            BigDecimal basePrice = product.getProductPriceGross();
            int quantity = Math.max(item.getQuantity(), 1);
            BigDecimal itemPrice = basePrice.add(optionsPrice).multiply(BigDecimal.valueOf(quantity));
            itemPrice = itemPrice.setScale(2, RoundingMode.HALF_UP);
            optionsPrice = optionsPrice.setScale(2, RoundingMode.HALF_UP);

            total = total.add(itemPrice);

            OrderItemSnapshot snapshot = new OrderItemSnapshot(
                    product.getId().toString(),
                    product.getProductName(),
                    basePrice.setScale(2, RoundingMode.HALF_UP),
                    product.getCurrencyCode(),
                    quantity,
                    selectedOptions,
                    optionsPrice,
                    itemPrice
            );
            snapshots.add(snapshot);
        }

        BigDecimal roundedTotal = total.setScale(2, RoundingMode.HALF_UP);
        return new OrderCalculationResult(snapshots, roundedTotal, currencyCode);
    }

    private OptionsDefinition convertOptions(JsonNode jsonNode) {
        if (jsonNode == null || jsonNode.isNull()) {
            return new OptionsDefinition(List.of());
        }
        try {
            return objectMapper.treeToValue(jsonNode, OptionsDefinition.class);
        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to parse options definition");
        }
    }

    private BigDecimal calculateOptionsPrice(OptionsDefinition definition, Map<String, Object> selectedOptions) {
        BigDecimal sum = BigDecimal.ZERO;
        for (OptionGroupDefinition group : definition.getGroups()) {
            Object selection = selectedOptions.get(group.getId());
            if (selection == null) {
                continue;
            }
            if (group.getType() == OptionGroupDefinition.GroupType.single) {
                if (selection instanceof String value) {
                    sum = sum.add(findPriceDelta(group, value));
                }
            } else if (group.getType() == OptionGroupDefinition.GroupType.multi) {
                if (selection instanceof Iterable<?> iterable) {
                    for (Object entry : iterable) {
                        if (entry instanceof String value) {
                            sum = sum.add(findPriceDelta(group, value));
                        }
                    }
                }
            }
        }
        return sum;
    }

    private BigDecimal findPriceDelta(OptionGroupDefinition group, String value) {
        for (OptionValueDefinition option : group.getValues()) {
            if (option.getLabel().equals(value)) {
                return option.getPriceDelta();
            }
        }
        return BigDecimal.ZERO;
    }
}
