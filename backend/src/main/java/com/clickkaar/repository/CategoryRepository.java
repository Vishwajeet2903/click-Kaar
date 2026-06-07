package com.clickkaar.repository;

import com.clickkaar.entity.Category;
import com.clickkaar.enums.ProductCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
  Optional<Category> findByName(ProductCategory name);
}
