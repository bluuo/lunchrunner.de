package de.lunchrunner.backend.model.options;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;

public class OptionValueDefinition {

    private final String label;
    private final BigDecimal priceDelta;

    @JsonCreator
    public OptionValueDefinition(@JsonProperty(value = "label", required = true) String label,
                                 @JsonProperty(value = "priceDelta", required = true) BigDecimal priceDelta) {
        this.label = label;
        this.priceDelta = priceDelta;
    }

    public String getLabel() {
        return label;
    }

    public BigDecimal getPriceDelta() {
        return priceDelta;
    }
}
