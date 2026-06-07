package com.clickkaar.repository;

import com.clickkaar.entity.Product;
import com.clickkaar.enums.AvailabilityStatus;
import com.clickkaar.enums.ProductCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.math.BigDecimal;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
  List<Product> findByNameContainingIgnoreCaseOrBrandContainingIgnoreCase(String name, String brand);
  List<Product> findByCategoryName(ProductCategory category);
  List<Product> findByBrandIgnoreCase(String brand);
  List<Product> findByAvailabilityStatus(AvailabilityStatus status);
  List<Product> findByDailyPriceBetween(BigDecimal minPrice, BigDecimal maxPrice);
}
