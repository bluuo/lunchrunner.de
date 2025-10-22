package de.lunchrunner.backend.web.controller;

import de.lunchrunner.backend.auth.ClerkAdminVerifier;
import de.lunchrunner.backend.service.ProductService;
import de.lunchrunner.backend.service.RealtimeBroadcastService;
import de.lunchrunner.backend.web.dto.ProductRequest;
import de.lunchrunner.backend.web.dto.ProductResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/products")
public class AdminProductsController {

    private final ProductService productService;
    private final ClerkAdminVerifier clerkAdminVerifier;
    private final RealtimeBroadcastService realtimeBroadcastService;

    public AdminProductsController(ProductService productService,
                                   ClerkAdminVerifier clerkAdminVerifier,
                                   RealtimeBroadcastService realtimeBroadcastService) {
        this.productService = productService;
        this.clerkAdminVerifier = clerkAdminVerifier;
        this.realtimeBroadcastService = realtimeBroadcastService;
    }

    @GetMapping
    public List<ProductResponse> listProducts(@RequestHeader(name = "Authorization", required = false) String authorization) {
        clerkAdminVerifier.assertAdmin(authorization);
        return productService.getAllProducts();
    }

    @PostMapping
    public ProductResponse upsertProduct(@RequestHeader(name = "Authorization", required = false) String authorization,
                                         @Valid @RequestBody ProductRequest request) {
        clerkAdminVerifier.assertAdmin(authorization);
        ProductResponse response = productService.saveProduct(request);
        realtimeBroadcastService.refreshAll();
        return response;
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProduct(@RequestHeader(name = "Authorization", required = false) String authorization,
                              @PathVariable String id) {
        clerkAdminVerifier.assertAdmin(authorization);
        productService.deleteProduct(id);
        realtimeBroadcastService.refreshAll();
    }
}
