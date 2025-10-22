package de.lunchrunner.backend.web.controller;

import de.lunchrunner.backend.service.DeviceOwnershipService;
import de.lunchrunner.backend.service.OrderService;
import de.lunchrunner.backend.service.RealtimeBroadcastService;
import de.lunchrunner.backend.web.dto.OrderRequest;
import de.lunchrunner.backend.web.dto.OrderResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
public class OrdersController {

    private final OrderService orderService;
    private final DeviceOwnershipService deviceOwnershipService;
    private final RealtimeBroadcastService realtimeBroadcastService;

    public OrdersController(OrderService orderService,
                            DeviceOwnershipService deviceOwnershipService,
                            RealtimeBroadcastService realtimeBroadcastService) {
        this.orderService = orderService;
        this.deviceOwnershipService = deviceOwnershipService;
        this.realtimeBroadcastService = realtimeBroadcastService;
    }

    @GetMapping
    public List<OrderResponse> listOrders() {
        return orderService.listOrders();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse createOrder(@RequestHeader(name = DeviceOwnershipService.HEADER_NAME) String deviceHeader,
                                     @Valid @RequestBody OrderRequest request) {
        UUID deviceId = deviceOwnershipService.requireDeviceId(deviceHeader);
        OrderResponse response = orderService.createOrder(request, deviceId);
        realtimeBroadcastService.refreshAll();
        return response;
    }

    @PutMapping("/{id}")
    public OrderResponse updateOrder(@PathVariable String id,
                                     @RequestHeader(name = DeviceOwnershipService.HEADER_NAME) String deviceHeader,
                                     @Valid @RequestBody OrderRequest request) {
        UUID deviceId = deviceOwnershipService.requireDeviceId(deviceHeader);
        OrderResponse response = orderService.updateOrder(id, request, deviceId);
        realtimeBroadcastService.refreshAll();
        return response;
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteOrder(@PathVariable String id,
                            @RequestHeader(name = DeviceOwnershipService.HEADER_NAME) String deviceHeader) {
        UUID deviceId = deviceOwnershipService.requireDeviceId(deviceHeader);
        orderService.deleteOrder(id, deviceId);
        realtimeBroadcastService.refreshAll();
    }
}
