package de.lunchrunner.backend.service;

import de.lunchrunner.backend.web.dto.OrderResponse;
import de.lunchrunner.backend.web.dto.ProductResponse;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RealtimeBroadcastService {

    private final ProductService productService;
    private final OrderService orderService;
    private final ObjectProvider<RealtimeGateway> realtimeGatewayProvider;

    public RealtimeBroadcastService(ProductService productService,
                                    OrderService orderService,
                                    ObjectProvider<RealtimeGateway> realtimeGatewayProvider) {
        this.productService = productService;
        this.orderService = orderService;
        this.realtimeGatewayProvider = realtimeGatewayProvider;
    }

    public void refreshAll() {
        RealtimeGateway realtimeGateway = realtimeGatewayProvider.getIfAvailable();
        if (realtimeGateway == null) {
            return;
        }
        List<ProductResponse> products = productService.getActiveProducts();
        List<OrderResponse> orders = orderService.listOrders();
        realtimeGateway.emitProductsUpdated(products);
        realtimeGateway.emitOrdersUpdated(orders);
    }
}
