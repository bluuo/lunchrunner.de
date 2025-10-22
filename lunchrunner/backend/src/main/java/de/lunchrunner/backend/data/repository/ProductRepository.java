package de.lunchrunner.backend.data.repository;

import de.lunchrunner.backend.data.entity.ProductEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<ProductEntity, UUID> {

    List<ProductEntity> findAllByOrderByProductNameAsc();

    List<ProductEntity> findByProductActiveTrueOrderByProductNameAsc();
}
