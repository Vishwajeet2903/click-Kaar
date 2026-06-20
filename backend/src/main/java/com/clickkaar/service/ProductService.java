package com.clickkaar.service;

import com.clickkaar.dto.product.ProductRequest;
import com.clickkaar.dto.product.ProductResponse;
import com.clickkaar.entity.Category;
import com.clickkaar.entity.Product;
import com.clickkaar.entity.ProductImage;
import com.clickkaar.enums.AvailabilityStatus;
import com.clickkaar.enums.ProductCategory;
import com.clickkaar.exception.ResourceNotFoundException;
import com.clickkaar.repository.CategoryRepository;
import com.clickkaar.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {
  private final ProductRepository productRepository;
  private final CategoryRepository categoryRepository;

  @Transactional(readOnly = true)
  public List<ProductResponse> findAll() {
    return productRepository.findAll().stream().map(this::toResponse).toList();
  }

  @Transactional(readOnly = true)
  public ProductResponse findById(Long id) {
    return toResponse(productRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Product not found")));
  }

  @Transactional(readOnly = true)
  public List<ProductResponse> search(String keyword) {
    return productRepository.findByNameContainingIgnoreCaseOrBrandContainingIgnoreCase(keyword, keyword).stream()
        .map(this::toResponse)
        .toList();
  }

  @Transactional(readOnly = true)
  public List<ProductResponse> byCategory(ProductCategory category) {
    return productRepository.findByCategoryName(category).stream().map(this::toResponse).toList();
  }

  @Transactional
  public ProductResponse create(ProductRequest request) {
    Category category = categoryRepository.findByName(request.category())
        .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
    Product product = Product.builder()
        .name(request.name())
        .brand(request.brand())
        .category(category)
        .shortDescription(request.shortDescription())
        .fullDescription(request.fullDescription())
        .specs(request.specs())
        .dailyPrice(request.dailyPrice())
        .weeklyPrice(request.weeklyPrice())
        .availabilityStatus(request.availabilityStatus() == null ? AvailabilityStatus.AVAILABLE : request.availabilityStatus())
        .build();
    if (request.images() != null) {
      request.images().forEach(url -> product.getImages().add(ProductImage.builder()
          .imageUrl(url)
          .primaryImage(product.getImages().isEmpty())
          .product(product)
          .build()));
    }
    return toResponse(productRepository.save(product));
  }

  @Transactional
  public ProductResponse update(Long id, ProductRequest request) {
    Product product = productRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Product not found"));
    Category category = categoryRepository.findByName(request.category())
        .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
    product.setName(request.name());
    product.setBrand(request.brand());
    product.setCategory(category);
    product.setShortDescription(request.shortDescription());
    product.setFullDescription(request.fullDescription());
    product.setSpecs(request.specs());
    product.setDailyPrice(request.dailyPrice());
    product.setWeeklyPrice(request.weeklyPrice());
    product.setAvailabilityStatus(request.availabilityStatus() == null ? product.getAvailabilityStatus() : request.availabilityStatus());
    if (request.images() != null) {
      product.getImages().clear();
      request.images().forEach(url -> product.getImages().add(ProductImage.builder()
          .imageUrl(url)
          .primaryImage(product.getImages().isEmpty())
          .product(product)
          .build()));
    }
    return toResponse(product);
  }

  public void delete(Long id) {
    productRepository.deleteById(id);
  }

  private ProductResponse toResponse(Product product) {
    return new ProductResponse(
        product.getId(),
        product.getName(),
        product.getBrand(),
        product.getCategory().getName(),
        product.getShortDescription(),
        product.getFullDescription(),
        product.getSpecs(),
        product.getDailyPrice(),
        product.getWeeklyPrice(),
        product.getAvailabilityStatus(),
        product.getImages().stream().map(ProductImage::getImageUrl).toList()
    );
  }
}
