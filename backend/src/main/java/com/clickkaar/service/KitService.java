package com.clickkaar.service;

import com.clickkaar.dto.admin.KitProductResponse;
import com.clickkaar.dto.admin.KitRequest;
import com.clickkaar.dto.admin.KitResponse;
import com.clickkaar.entity.Kit;
import com.clickkaar.entity.Product;
import com.clickkaar.exception.BadRequestException;
import com.clickkaar.exception.ResourceNotFoundException;
import com.clickkaar.repository.KitRepository;
import com.clickkaar.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class KitService {
  private final KitRepository kitRepository;
  private final ProductRepository productRepository;

  @Transactional(readOnly = true)
  public List<KitResponse> findAll() {
    return kitRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
  }

  @Transactional(readOnly = true)
  public List<KitResponse> findActive() {
    return kitRepository.findByActiveTrueOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
  }

  @Transactional
  public KitResponse create(KitRequest request) {
    List<Product> products = productsFor(request.productIds());
    Kit kit = Kit.builder()
        .name(request.name().trim())
        .description(request.description().trim())
        .imageUrl(request.imageUrl().trim())
        .rent(request.rent())
        .active(request.active() == null || request.active())
        .products(products)
        .build();
    return toResponse(kitRepository.save(kit));
  }

  @Transactional
  public void delete(Long kitId) {
    if (!kitRepository.existsById(kitId)) {
      throw new ResourceNotFoundException("Kit not found");
    }
    kitRepository.deleteById(kitId);
  }

  private List<Product> productsFor(List<Long> productIds) {
    List<Long> uniqueIds = new LinkedHashSet<>(productIds).stream().toList();
    List<Product> products = uniqueIds.stream()
        .map(productId -> productRepository.findByIdAndDeletedFalse(productId)
            .orElseThrow(() -> new BadRequestException("Product not found in kit: " + productId)))
        .toList();
    if (products.isEmpty()) {
      throw new BadRequestException("Add at least one product to the kit");
    }
    return products;
  }

  private KitResponse toResponse(Kit kit) {
    return new KitResponse(
        kit.getId(),
        kit.getName(),
        kit.getDescription(),
        kit.getImageUrl(),
        kit.getRent(),
        kit.isActive(),
        kit.getProducts().stream().map(this::toProductResponse).toList(),
        kit.getCreatedAt()
    );
  }

  private KitProductResponse toProductResponse(Product product) {
    return new KitProductResponse(
        product.getId(),
        product.getName(),
        product.getBrand(),
        product.getCategory().getDisplayName(),
        product.getDailyPrice()
    );
  }
}