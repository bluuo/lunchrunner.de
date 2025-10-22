package de.lunchrunner.backend.data.repository;

import de.lunchrunner.backend.data.entity.OrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<OrderEntity, UUID> {

    List<OrderEntity> findAllByOrderByCreatedAtAsc();

    Optional<OrderEntity> findByIdAndDeviceId(UUID id, UUID deviceId);
}
