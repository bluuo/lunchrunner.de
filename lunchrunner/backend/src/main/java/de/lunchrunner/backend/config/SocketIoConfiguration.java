package de.lunchrunner.backend.config;

import com.corundumstudio.socketio.Configuration;
import com.corundumstudio.socketio.SocketConfig;
import com.corundumstudio.socketio.SocketIOServer;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SocketIoConfiguration {

    @Bean(destroyMethod = "stop")
    @ConditionalOnProperty(prefix = "lunchrunner", name = "socket-io-enabled", havingValue = "true", matchIfMissing = true)
    public SocketIOServer socketIOServer(ApplicationProperties properties) {
        Configuration config = new Configuration();
        config.setHostname("0.0.0.0");
        config.setPort(properties.getSocketIoPort());
        config.setContext(properties.getSocketIoPath());
        config.setOrigin(properties.getCorsOrigin());
        SocketConfig socketConfig = config.getSocketConfig();
        socketConfig.setReuseAddress(true);
        socketConfig.setTcpNoDelay(true);
        return new SocketIOServer(config);
    }
}
