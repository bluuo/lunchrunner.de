package de.lunchrunner.backend.model.order;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrderItemSnapshot {

    private final String productId;
    private final String productNameSnapshot;
    private final BigDecimal productBasePriceSnapshot;
    private final String currencyCode;
    private final int quantity;
    private final Map<String, Object> selectedOptions;
    private final BigDecimal optionsPriceTotalSnapshot;
    private final BigDecimal itemPriceGrossSnapshot;

    @JsonCreator
    public OrderItemSnapshot(
            @JsonProperty(value = "productId", required = true) String productId,
            @JsonProperty(value = "productNameSnapshot", required = true) String productNameSnapshot,
            @JsonProperty(value = "productBasePriceSnapshot", required = true) BigDecimal productBasePriceSnapshot,
            @JsonProperty(value = "currencyCode", required = true) String currencyCode,
            @JsonProperty(value = "quantity", required = true) int quantity,
            @JsonProperty(value = "selectedOptions") Map<String, Object> selectedOptions,
            @JsonProperty(value = "optionsPriceTotalSnapshot", required = true) BigDecimal optionsPriceTotalSnapshot,
            @JsonProperty(value = "itemPriceGrossSnapshot", required = true) BigDecimal itemPriceGrossSnapshot) {
        this.productId = productId;
        this.productNameSnapshot = productNameSnapshot;
        this.productBasePriceSnapshot = productBasePriceSnapshot;
        this.currencyCode = currencyCode;
        this.quantity = quantity;
        this.selectedOptions = selectedOptions == null ? Collections.emptyMap() : Map.copyOf(selectedOptions);
        this.optionsPriceTotalSnapshot = optionsPriceTotalSnapshot;
        this.itemPriceGrossSnapshot = itemPriceGrossSnapshot;
    }

    public String getProductId() {
        return productId;
    }

    public String getProductNameSnapshot() {
        return productNameSnapshot;
    }

    public BigDecimal getProductBasePriceSnapshot() {
        return productBasePriceSnapshot;
    }

    public String getCurrencyCode() {
        return currencyCode;
    }

    public int getQuantity() {
        return quantity;
    }

    public Map<String, Object> getSelectedOptions() {
        return selectedOptions;
    }

    public BigDecimal getOptionsPriceTotalSnapshot() {
        return optionsPriceTotalSnapshot;
    }

    public BigDecimal getItemPriceGrossSnapshot() {
        return itemPriceGrossSnapshot;
    }
}
