package com.clickkaar.controller;

import com.clickkaar.dto.product.ProductRequest;
import com.clickkaar.dto.product.ProductResponse;
import com.clickkaar.enums.ProductCategory;
import com.clickkaar.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {
  private final ProductService productService;

  @GetMapping
  public List<ProductResponse> all() {
    return productService.findAll();
  }

  @GetMapping("/{id}")
  public ProductResponse one(@PathVariable Long id) {
    return productService.findById(id);
  }

  @GetMapping("/search")
  public List<ProductResponse> search(@RequestParam String keyword) {
    return productService.search(keyword);
  }

  @GetMapping("/category/{category}")
  public List<ProductResponse> category(@PathVariable ProductCategory category) {
    return productService.byCategory(category);
  }

  @PostMapping
  @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','INVENTORY_STAFF')")
  public ProductResponse create(@Valid @RequestBody ProductRequest request) {
    return productService.create(request);
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','INVENTORY_STAFF')")
  public ProductResponse update(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
    return productService.update(id, request);
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','INVENTORY_STAFF')")
  public void delete(@PathVariable Long id) {
    productService.delete(id);
  }
}
