package de.lunchrunner.backend.service;

import com.corundumstudio.socketio.SocketIONamespace;
import com.corundumstudio.socketio.SocketIOServer;
import de.lunchrunner.backend.web.dto.OrderResponse;
import de.lunchrunner.backend.web.dto.ProductResponse;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@ConditionalOnBean(SocketIOServer.class)
public class RealtimeGateway {

    private static final Logger LOGGER = LoggerFactory.getLogger(RealtimeGateway.class);
    private final SocketIOServer socketIOServer;
    private SocketIONamespace namespace;

    public RealtimeGateway(SocketIOServer socketIOServer) {
        this.socketIOServer = socketIOServer;
    }

    @PostConstruct
    public void start() {
        namespace = socketIOServer.addNamespace("/realtime");
        namespace.addConnectListener(client -> {
            LOGGER.info("Socket connected: {}", client.getSessionId());
            client.joinRoom("global");
        });
        namespace.addDisconnectListener(client -> LOGGER.info("Socket disconnected: {}", client.getSessionId()));
        if (!socketIOServer.isActive()) {
            socketIOServer.start();
        }
    }

    @PreDestroy
    public void stop() {
        socketIOServer.stop();
    }

    public void emitProductsUpdated(List<ProductResponse> products) {
        if (namespace != null) {
            namespace.getRoomOperations("global").sendEvent("productsUpdated", products);
        }
    }

    public void emitOrdersUpdated(List<OrderResponse> orders) {
        if (namespace != null) {
            namespace.getRoomOperations("global").sendEvent("ordersUpdated", orders);
        }
    }
}
