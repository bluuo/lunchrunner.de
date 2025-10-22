package de.lunchrunner.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import de.lunchrunner.backend.data.entity.ProductEntity;
import de.lunchrunner.backend.data.repository.ProductRepository;
import de.lunchrunner.backend.model.options.OptionGroupDefinition;
import de.lunchrunner.backend.model.options.OptionValueDefinition;
import de.lunchrunner.backend.model.options.OptionsDefinition;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class SeedDataRunner {

    private static final Logger LOGGER = LoggerFactory.getLogger(SeedDataRunner.class);

    private final ProductRepository productRepository;
    private final ObjectMapper objectMapper;

    public SeedDataRunner(ProductRepository productRepository, ObjectMapper objectMapper) {
        this.productRepository = productRepository;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void seedIfEmpty() {
        if (productRepository.count() > 0) {
            return;
        }
        LOGGER.info("Seeding example products");
        productRepository.save(createProduct(
                "Classic Burger",
                "Juicy beef burger with lettuce and tomato",
                new BigDecimal("6.50"),
                "Burgers",
                exampleOptions()
        ));
        productRepository.save(createProduct(
                "Veggie Wrap",
                "Grilled vegetables with hummus in a wrap",
                new BigDecimal("5.20"),
                "Wraps",
                exampleOptions()
        ));
        productRepository.save(createProduct(
                "French Fries",
                "Crispy fries with dip options",
                new BigDecimal("3.10"),
                "Sides",
                exampleOptions()
        ));
    }

    private ProductEntity createProduct(String name, String description, BigDecimal price, String category, OptionsDefinition options) {
        ProductEntity entity = new ProductEntity();
        entity.setProductName(name);
        entity.setProductDescription(description);
        entity.setProductPriceGross(price);
        entity.setCurrencyCode("EUR");
        entity.setProductCategory(category);
        entity.setProductActive(true);
        entity.setOptionsDefinition(objectMapper.valueToTree(options));
        return entity;
    }

    private OptionsDefinition exampleOptions() {
        OptionGroupDefinition sauce = new OptionGroupDefinition(
                "sauce",
                "Sauce",
                OptionGroupDefinition.GroupType.single,
                List.of(
                        new OptionValueDefinition("Ketchup", new BigDecimal("0.00")),
                        new OptionValueDefinition("BBQ", new BigDecimal("0.20"))
                )
        );
        OptionGroupDefinition extras = new OptionGroupDefinition(
                "extras",
                "Extras",
                OptionGroupDefinition.GroupType.multi,
                List.of(
                        new OptionValueDefinition("Onions", new BigDecimal("0.10")),
                        new OptionValueDefinition("Cheese", new BigDecimal("0.40"))
                )
        );
        return new OptionsDefinition(List.of(sauce, extras));
    }
}
