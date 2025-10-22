package de.lunchrunner.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import de.lunchrunner.backend.data.entity.ProductEntity;
import de.lunchrunner.backend.model.options.OptionGroupDefinition;
import de.lunchrunner.backend.model.options.OptionValueDefinition;
import de.lunchrunner.backend.model.options.OptionsDefinition;
import de.lunchrunner.backend.web.dto.OrderItemRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PriceCalculationServiceTest {

    private PriceCalculationService priceCalculationService;
    private ProductEntity burgerProduct;

    @BeforeEach
    void setUp() {
        OptionsValidationService validationService = new OptionsValidationService();
        priceCalculationService = new PriceCalculationService(validationService, new ObjectMapper());
        burgerProduct = new ProductEntity();
        burgerProduct.setId(UUID.randomUUID());
        burgerProduct.setProductName("Classic Burger");
        burgerProduct.setProductPriceGross(new BigDecimal("6.50"));
        burgerProduct.setCurrencyCode("EUR");
        burgerProduct.setOptionsDefinition(new ObjectMapper().valueToTree(new OptionsDefinition(List.of(
                new OptionGroupDefinition(
                        "sauce",
                        "Sauce",
                        OptionGroupDefinition.GroupType.single,
                        List.of(
                                new OptionValueDefinition("Ketchup", new BigDecimal("0.00")),
                                new OptionValueDefinition("BBQ", new BigDecimal("0.20"))
                        )
                ),
                new OptionGroupDefinition(
                        "extras",
                        "Extras",
                        OptionGroupDefinition.GroupType.multi,
                        List.of(
                                new OptionValueDefinition("Onions", new BigDecimal("0.10")),
                                new OptionValueDefinition("Cheese", new BigDecimal("0.40"))
                        )
                )
        ))));
    }

    @Test
    void calculatesTotalsCorrectly() {
        OrderItemRequest request = new OrderItemRequest();
        request.setProductId(burgerProduct.getId().toString());
        request.setQuantity(2);
        request.setSelectedOptions(Map.of(
                "sauce", "BBQ",
                "extras", List.of("Onions", "Cheese")
        ));

        OrderCalculationResult result = priceCalculationService.calculate(List.of(burgerProduct), List.of(request), "EUR");
        assertEquals(new BigDecimal("13.60"), result.totalPriceGross());
        assertEquals(1, result.items().size());
        assertEquals(new BigDecimal("6.80"), result.items().get(0).getItemPriceGrossSnapshot());
        assertEquals(new BigDecimal("0.50"), result.items().get(0).getOptionsPriceTotalSnapshot());
    }

    @Test
    void throwsWhenProductMissing() {
        OrderItemRequest request = new OrderItemRequest();
        request.setProductId(UUID.randomUUID().toString());
        request.setQuantity(1);
        assertThrows(ResponseStatusException.class,
                () -> priceCalculationService.calculate(List.of(), List.of(request), "EUR"));
    }

    @Test
    void throwsOnInvalidOption() {
        OrderItemRequest request = new OrderItemRequest();
        request.setProductId(burgerProduct.getId().toString());
        request.setQuantity(1);
        request.setSelectedOptions(Map.of("sauce", "Mustard"));
        assertThrows(IllegalArgumentException.class, () -> priceCalculationService.calculate(List.of(burgerProduct), List.of(request), "EUR"));
    }
}
