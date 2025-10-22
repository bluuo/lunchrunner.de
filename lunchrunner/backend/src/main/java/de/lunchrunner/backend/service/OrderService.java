package de.lunchrunner.backend.service;

import de.lunchrunner.backend.data.entity.OrderEntity;
import de.lunchrunner.backend.data.entity.ProductEntity;
import de.lunchrunner.backend.data.repository.OrderRepository;
import de.lunchrunner.backend.data.repository.ProductRepository;
import de.lunchrunner.backend.model.order.OrderItemSnapshot;
import de.lunchrunner.backend.web.dto.OrderRequest;
import de.lunchrunner.backend.web.dto.OrderResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final PriceCalculationService priceCalculationService;

    public OrderService(OrderRepository orderRepository,
                        ProductRepository productRepository,
                        PriceCalculationService priceCalculationService) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.priceCalculationService = priceCalculationService;
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> listOrders() {
        return orderRepository.findAllByOrderByCreatedAtAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    public OrderResponse createOrder(OrderRequest request, UUID deviceId) {
        List<ProductEntity> products = productRepository.findAll();
        String currency = request.getCurrencyCode() == null || request.getCurrencyCode().isBlank()
                ? "EUR"
                : request.getCurrencyCode();
        OrderCalculationResult calculationResult = priceCalculationService.calculate(products, request.getItems(), currency);

        OrderEntity entity = new OrderEntity();
        entity.setDeviceId(deviceId);
        entity.setCustomerName(request.getCustomerName());
        entity.setItems(calculationResult.items());
        entity.setTotalPriceGross(calculationResult.totalPriceGross());
        entity.setCurrencyCode(calculationResult.currencyCode());

        OrderEntity saved = orderRepository.save(entity);
        return toResponse(saved);
    }

    public OrderResponse updateOrder(String id, OrderRequest request, UUID deviceId) {
        UUID uuid = parseUuid(id);
        OrderEntity entity = orderRepository.findById(uuid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if (!entity.getDeviceId().equals(deviceId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only modify your own orders");
        }
        List<ProductEntity> products = productRepository.findAll();
        String currency = request.getCurrencyCode() == null || request.getCurrencyCode().isBlank()
                ? entity.getCurrencyCode()
                : request.getCurrencyCode();
        OrderCalculationResult calculationResult = priceCalculationService.calculate(products, request.getItems(), currency);

        entity.setCustomerName(request.getCustomerName());
        entity.setItems(calculationResult.items());
        entity.setTotalPriceGross(calculationResult.totalPriceGross());
        entity.setCurrencyCode(calculationResult.currencyCode());

        return toResponse(orderRepository.save(entity));
    }

    public void deleteOrder(String id, UUID deviceId) {
        UUID uuid = parseUuid(id);
        OrderEntity entity = orderRepository.findById(uuid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if (!entity.getDeviceId().equals(deviceId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only modify your own orders");
        }
        orderRepository.delete(entity);
    }

    private UUID parseUuid(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid identifier supplied");
        }
    }

    private OrderResponse toResponse(OrderEntity entity) {
        List<OrderItemSnapshot> items = entity.getItems();
        return new OrderResponse(
                entity.getId().toString(),
                entity.getDeviceId().toString(),
                entity.getCustomerName(),
                items,
                entity.getTotalPriceGross(),
                entity.getCurrencyCode(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
