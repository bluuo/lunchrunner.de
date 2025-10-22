package de.lunchrunner.backend.service;

import de.lunchrunner.backend.model.options.OptionGroupDefinition;
import de.lunchrunner.backend.model.options.OptionValueDefinition;
import de.lunchrunner.backend.model.options.OptionsDefinition;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class OptionsValidationServiceTest {

    private OptionsValidationService optionsValidationService;
    private OptionsDefinition optionsDefinition;

    @BeforeEach
    void setUp() {
        optionsValidationService = new OptionsValidationService();
        OptionGroupDefinition sauce = new OptionGroupDefinition(
                "sauce",
                "Sauce",
                OptionGroupDefinition.GroupType.single,
                List.of(
                        new OptionValueDefinition("Ketchup", new BigDecimal("0.00")),
                        new OptionValueDefinition("BBQ", new BigDecimal("0.20"))
                )
        );
        OptionGroupDefinition extras = new OptionGroupDefinition(
                "extras",
                "Extras",
                OptionGroupDefinition.GroupType.multi,
                List.of(
                        new OptionValueDefinition("Onions", new BigDecimal("0.10")),
                        new OptionValueDefinition("Cheese", new BigDecimal("0.40"))
                )
        );
        optionsDefinition = new OptionsDefinition(List.of(sauce, extras));
    }

    @Test
    void validatesValidSelection() {
        assertDoesNotThrow(() -> optionsValidationService.validateSelection(optionsDefinition, Map.of(
                "sauce", "BBQ",
                "extras", List.of("Onions", "Cheese")
        )));
    }

    @Test
    void rejectsUnknownGroup() {
        assertThrows(IllegalArgumentException.class, () -> optionsValidationService.validateSelection(optionsDefinition, Map.of(
                "unknown", "BBQ"
        )));
    }

    @Test
    void rejectsInvalidSingleValue() {
        assertThrows(IllegalArgumentException.class, () -> optionsValidationService.validateSelection(optionsDefinition, Map.of(
                "sauce", "Mustard"
        )));
    }

    @Test
    void rejectsInvalidMultiValue() {
        assertThrows(IllegalArgumentException.class, () -> optionsValidationService.validateSelection(optionsDefinition, Map.of(
                "extras", List.of("Bacon")
        )));
    }
}
