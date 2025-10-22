package de.lunchrunner.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.lunchrunner.backend.data.entity.ProductEntity;
import de.lunchrunner.backend.data.repository.ProductRepository;
import de.lunchrunner.backend.model.options.OptionsDefinition;
import de.lunchrunner.backend.web.dto.ProductRequest;
import de.lunchrunner.backend.web.dto.ProductResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class ProductService {

    private final ProductRepository productRepository;
    private final ObjectMapper objectMapper;

    public ProductService(ProductRepository productRepository, ObjectMapper objectMapper) {
        this.productRepository = productRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getActiveProducts() {
        return productRepository.findByProductActiveTrueOrderByProductNameAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProducts() {
        return productRepository.findAllByOrderByProductNameAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    public ProductResponse saveProduct(ProductRequest request) {
        ProductEntity entity = resolveEntity(request.getId());
        entity.setProductName(request.getProductName());
        entity.setProductDescription(request.getProductDescription());
        entity.setProductPriceGross(request.getProductPriceGross());
        entity.setCurrencyCode(Optional.ofNullable(request.getCurrencyCode()).filter(code -> !code.isBlank()).orElse("EUR"));
        entity.setProductCategory(request.getProductCategory());
        entity.setProductActive(request.isProductActive());
        entity.setOptionsDefinition(objectMapper.valueToTree(request.getOptionsDefinition()));
        ProductEntity saved = productRepository.save(entity);
        return toResponse(saved);
    }

    public void deleteProduct(String id) {
        UUID uuid = parseUuid(id);
        if (!productRepository.existsById(uuid)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
        }
        productRepository.deleteById(uuid);
    }

    private ProductEntity resolveEntity(String id) {
        if (id == null || id.isBlank()) {
            return new ProductEntity();
        }
        UUID uuid = parseUuid(id);
        return productRepository.findById(uuid).orElseGet(() -> {
            ProductEntity entity = new ProductEntity();
            entity.setId(uuid);
            return entity;
        });
    }

    private UUID parseUuid(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid identifier supplied");
        }
    }

    private ProductResponse toResponse(ProductEntity entity) {
        OptionsDefinition definition = new OptionsDefinition(List.of());
        JsonNode node = entity.getOptionsDefinition();
        if (node != null && !node.isNull()) {
            definition = objectMapper.convertValue(node, OptionsDefinition.class);
        }
        return new ProductResponse(
                entity.getId().toString(),
                entity.getProductName(),
                entity.getProductDescription(),
                entity.getProductPriceGross(),
                entity.getCurrencyCode(),
                entity.getProductCategory(),
                entity.isProductActive(),
                definition,
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
