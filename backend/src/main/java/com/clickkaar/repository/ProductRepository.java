package com.clickkaar.repository;

import com.clickkaar.entity.Product;
import com.clickkaar.enums.AvailabilityStatus;
import com.clickkaar.enums.ProductCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
  List<Product> findByDeletedFalse();
  Optional<Product> findByIdAndDeletedFalse(Long id);
  Optional<Product> findByNameIgnoreCaseAndDeletedFalse(String name);
  List<Product> findByNameContainingIgnoreCaseAndDeletedFalseOrBrandContainingIgnoreCaseAndDeletedFalse(String name, String brand);
  List<Product> findByCategoryNameAndDeletedFalse(ProductCategory category);
  List<Product> findByBrandIgnoreCaseAndDeletedFalse(String brand);
  List<Product> findByAvailabilityStatusAndDeletedFalse(AvailabilityStatus status);
  List<Product> findByDailyPriceBetweenAndDeletedFalse(BigDecimal minPrice, BigDecimal maxPrice);
}
