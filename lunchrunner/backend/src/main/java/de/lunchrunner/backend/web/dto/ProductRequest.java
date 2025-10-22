package de.lunchrunner.backend.web.dto;

import de.lunchrunner.backend.model.options.OptionsDefinition;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public class ProductRequest {

    private String id;

    @NotBlank
    private String productName;

    private String productDescription;

    @NotNull
    @Positive
    private BigDecimal productPriceGross;

    private String currencyCode = "EUR";

    private String productCategory;

    private boolean productActive = true;

    @NotNull
    @Valid
    private OptionsDefinition optionsDefinition;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getProductDescription() {
        return productDescription;
    }

    public void setProductDescription(String productDescription) {
        this.productDescription = productDescription;
    }

    public BigDecimal getProductPriceGross() {
        return productPriceGross;
    }

    public void setProductPriceGross(BigDecimal productPriceGross) {
        this.productPriceGross = productPriceGross;
    }

    public String getCurrencyCode() {
        return currencyCode;
    }

    public void setCurrencyCode(String currencyCode) {
        this.currencyCode = currencyCode;
    }

    public String getProductCategory() {
        return productCategory;
    }

    public void setProductCategory(String productCategory) {
        this.productCategory = productCategory;
    }

    public boolean isProductActive() {
        return productActive;
    }

    public void setProductActive(boolean productActive) {
        this.productActive = productActive;
    }

    public OptionsDefinition getOptionsDefinition() {
        return optionsDefinition;
    }

    public void setOptionsDefinition(OptionsDefinition optionsDefinition) {
        this.optionsDefinition = optionsDefinition;
    }
}
