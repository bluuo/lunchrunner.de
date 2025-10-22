package de.lunchrunner.backend;

import de.lunchrunner.backend.web.dto.OrderItemRequest;
import de.lunchrunner.backend.web.dto.OrderRequest;
import de.lunchrunner.backend.web.dto.ProductResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@TestPropertySource(properties = {
        "lunchrunner.socket-io-enabled=false"
})
class E2ESmokeTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void configureDatasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void createAndListOrderFlow() {
        ResponseEntity<ProductResponse[]> productsResponse = restTemplate.getForEntity("/api/products", ProductResponse[].class);
        assertThat(productsResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        ProductResponse[] products = productsResponse.getBody();
        assertThat(products).isNotNull();
        assertThat(products.length).isGreaterThan(0);

        ProductResponse product = products[0];
        OrderItemRequest itemRequest = new OrderItemRequest();
        itemRequest.setProductId(product.id());
        itemRequest.setQuantity(2);
        itemRequest.setSelectedOptions(Map.of());

        OrderRequest orderRequest = new OrderRequest();
        orderRequest.setCustomerName("Integration Tester");
        orderRequest.setItems(List.of(itemRequest));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.add("x-device-id", UUID.randomUUID().toString());
        HttpEntity<OrderRequest> entity = new HttpEntity<>(orderRequest, headers);

        ResponseEntity<String> createResponse = restTemplate.postForEntity("/api/orders", entity, String.class);
        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        ResponseEntity<String> ordersResponse = restTemplate.getForEntity("/api/orders", String.class);
        assertThat(ordersResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
}
