package de.lunchrunner.backend.web.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import java.util.Map;

public class OrderItemRequest {

    @NotBlank
    private String productId;

    @Min(1)
    private int quantity = 1;

    private Map<String, Object> selectedOptions;

    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public Map<String, Object> getSelectedOptions() {
        return selectedOptions;
    }

    public void setSelectedOptions(Map<String, Object> selectedOptions) {
        this.selectedOptions = selectedOptions;
    }
}
