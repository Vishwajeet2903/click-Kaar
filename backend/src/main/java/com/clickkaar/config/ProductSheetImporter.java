package com.clickkaar.config;

import com.clickkaar.entity.Category;
import com.clickkaar.entity.Product;
import com.clickkaar.entity.ProductImage;
import com.clickkaar.enums.AvailabilityStatus;
import com.clickkaar.enums.ProductCategory;
import com.clickkaar.repository.CategoryRepository;
import com.clickkaar.repository.ProductRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
@Order(Ordered.LOWEST_PRECEDENCE)
@ConditionalOnProperty(name = "app.product-import.enabled", havingValue = "true")
public class ProductSheetImporter implements CommandLineRunner {
  private static final String DEFAULT_SHEET_URL = "https://docs.google.com/spreadsheets/d/1Ixp8b0jia1HmZpHioICAP5S49thj1JQK1coq2fxJO3g/export?format=csv&gid=0";
  private static final List<ProductCategory> CATEGORY_ORDER = List.of(
      ProductCategory.CAMERAS,
      ProductCategory.LENSES,
      ProductCategory.LIGHTING,
      ProductCategory.AUDIO,
      ProductCategory.TRIPODS_SUPPORT,
      ProductCategory.ACCESSORIES
  );

  private final CategoryRepository categoryRepository;
  private final ProductRepository productRepository;
  private final EntityManager entityManager;

  @Value("${app.product-import.url:" + DEFAULT_SHEET_URL + "}")
  private String importUrl;

  @Value("${app.product-import.reset:true}")
  private boolean resetProducts;

  @Value("${app.product-import.image-base-path:/products/}")
  private String imageBasePath;

  @Override
  @Transactional
  public void run(String... args) throws Exception {
    ensureCategories();
    List<Product> products = parseProducts(downloadCsv(importUrl));
    if (products.isEmpty()) {
      log.warn("Product import skipped because no products were found in {}", importUrl);
      return;
    }

    if (resetProducts) {
      clearProductData();
    }

    productRepository.saveAll(products);
    log.info("Imported {} products from {}", products.size(), importUrl);
  }

  private void ensureCategories() {
    for (ProductCategory category : CATEGORY_ORDER) {
      categoryRepository.findByName(category).orElseGet(() -> categoryRepository.save(Category.builder()
          .name(category)
          .displayName(displayCategory(category))
          .description("Rental equipment category")
          .build()));
    }
  }

  private void clearProductData() {
    entityManager.createQuery("delete from Wishlist").executeUpdate();
    entityManager.createQuery("delete from BookingItem").executeUpdate();
    entityManager.createQuery("delete from ProductImage").executeUpdate();
    entityManager.createQuery("delete from Product").executeUpdate();
  }

  private String downloadCsv(String url) throws Exception {
    try (BufferedReader reader = new BufferedReader(new InputStreamReader(URI.create(url).toURL().openStream(), StandardCharsets.UTF_8))) {
      StringBuilder csv = new StringBuilder();
      String line;
      while ((line = reader.readLine()) != null) {
        csv.append(line).append('\n');
      }
      return csv.toString();
    }
  }

  private List<Product> parseProducts(String csv) {
    List<Product> products = new ArrayList<>();
    List<List<String>> rows = parseCsv(csv);
    Map<Integer, String> headers = new HashMap<>();
    ProductCategory currentCategory = ProductCategory.ACCESSORIES;
    String currentSection = "";
    String lastBrand = "";

    for (List<String> row : rows) {
      if (isBlankRow(row)) {
        continue;
      }

      if (isSectionHeader(row)) {
        currentSection = cell(row, 0);
        currentCategory = mapCategory(currentSection);
        headers = readHeaders(row);
        lastBrand = "";
        continue;
      }

      String name = clean(cell(row, 2));
      if (name.isBlank() || name.equalsIgnoreCase("Product Name")) {
        continue;
      }

      String brand = clean(cell(row, 1));
      if (!brand.isBlank()) {
        lastBrand = brand;
      } else {
        brand = lastBrand.isBlank() ? clean(currentSection) : lastBrand;
      }

      List<String> imageLinks = images(row, headers);
      Product product = Product.builder()
          .name(name)
          .brand(brand)
          .category(categoryRepository.findByName(currentCategory).orElseThrow())
          .shortDescription(shortDescription(row, headers, brand, name))
          .fullDescription(fullDescription(row, headers))
          .specs(specs(row, headers))
          .dailyPrice(price(cell(row, 4)))
          .weeklyPrice(weeklyPrice(row))
          .imageLink(imageLink(imageLinks, 0))
          .link1(imageLink(imageLinks, 1))
          .link2(imageLink(imageLinks, 2))
          .availabilityStatus(AvailabilityStatus.AVAILABLE)
          .build();

      imageLinks.forEach(url -> product.getImages().add(ProductImage.builder()
          .imageUrl(url)
          .primaryImage(product.getImages().isEmpty())
          .product(product)
          .build()));

      products.add(product);
    }

    return products;
  }

  private List<List<String>> parseCsv(String csv) {
    List<List<String>> rows = new ArrayList<>();
    List<String> row = new ArrayList<>();
    StringBuilder field = new StringBuilder();
    boolean quoted = false;

    for (int index = 0; index < csv.length(); index += 1) {
      char current = csv.charAt(index);
      if (quoted) {
        if (current == '"') {
          if (index + 1 < csv.length() && csv.charAt(index + 1) == '"') {
            field.append('"');
            index += 1;
          } else {
            quoted = false;
          }
        } else {
          field.append(current);
        }
        continue;
      }

      if (current == '"') {
        quoted = true;
      } else if (current == ',') {
        row.add(field.toString());
        field.setLength(0);
      } else if (current == '\n') {
        row.add(field.toString());
        rows.add(row);
        row = new ArrayList<>();
        field.setLength(0);
      } else if (current != '\r') {
        field.append(current);
      }
    }

    if (!field.isEmpty() || !row.isEmpty()) {
      row.add(field.toString());
      rows.add(row);
    }

    return rows;
  }

  private boolean isSectionHeader(List<String> row) {
    return !cell(row, 0).isBlank()
        && cell(row, 1).equalsIgnoreCase("Brand")
        && cell(row, 2).equalsIgnoreCase("Product Name");
  }

  private Map<Integer, String> readHeaders(List<String> row) {
    Map<Integer, String> headers = new LinkedHashMap<>();
    for (int index = 0; index < row.size(); index += 1) {
      String header = clean(row.get(index));
      if (!header.isBlank()) {
        headers.put(index, header);
      }
    }
    return headers;
  }

  private boolean isBlankRow(List<String> row) {
    return row.stream().allMatch(value -> clean(value).isBlank());
  }

  private ProductCategory mapCategory(String section) {
    String normalized = section.toLowerCase(Locale.ROOT);
    if (normalized.contains("camera")) {
      return ProductCategory.CAMERAS;
    }
    if (normalized.contains("lens")) {
      return ProductCategory.LENSES;
    }
    if (normalized.contains("light") || normalized.contains("modifi") || normalized.contains("reflector")) {
      return ProductCategory.LIGHTING;
    }
    if (normalized.contains("audio") || normalized.contains("mic")) {
      return ProductCategory.AUDIO;
    }
    if (normalized.contains("tripod")) {
      return ProductCategory.TRIPODS_SUPPORT;
    }
    return ProductCategory.ACCESSORIES;
  }

  private String shortDescription(List<String> row, Map<Integer, String> headers, String brand, String name) {
    String description = valueFor(row, headers, "description");
    if (description.isBlank()) {
      return brand + " rental equipment: " + name;
    }
    return description.length() > 220 ? description.substring(0, 217) + "..." : description;
  }

  private String fullDescription(List<String> row, Map<Integer, String> headers) {
    String description = valueFor(row, headers, "description");
    String bestFor = valueFor(row, headers, "best for");
    if (bestFor.isBlank()) {
      bestFor = valueFor(row, headers, "best");
    }
    if (bestFor.isBlank()) {
      return description;
    }
    return description.isBlank() ? "Best for: " + bestFor : description + "\n\nBest for: " + bestFor;
  }

  private String specs(List<String> row, Map<Integer, String> headers) {
    List<String> lines = new ArrayList<>();
    for (Map.Entry<Integer, String> entry : headers.entrySet()) {
      int index = entry.getKey();
      String header = entry.getValue();
      String normalized = normalize(header);
      if (index <= 8 || normalized.contains("description") || normalized.contains("best") || isImageHeader(normalized)) {
        continue;
      }

      String value = clean(cell(row, index));
      if (!value.isBlank()) {
        lines.add(header + ": " + value);
      }
    }
    return String.join("\n", lines);
  }

  private List<String> images(List<String> row, Map<Integer, String> headers) {
    List<String> images = new ArrayList<>();
    for (Map.Entry<Integer, String> entry : headers.entrySet()) {
      String normalized = normalize(entry.getValue());
      if (!isImageHeader(normalized)) {
        continue;
      }

      String image = clean(cell(row, entry.getKey()));
      if (!image.isBlank()) {
        images.add(imagePath(image));
      }
    }
    return images;
  }

  private String imageLink(List<String> images, int index) {
    return index < images.size() ? images.get(index) : null;
  }

  private String valueFor(List<String> row, Map<Integer, String> headers, String headerName) {
    String wanted = normalize(headerName);
    return headers.entrySet().stream()
        .filter(entry -> normalize(entry.getValue()).contains(wanted))
        .map(entry -> clean(cell(row, entry.getKey())))
        .filter(value -> !value.isBlank())
        .findFirst()
        .orElse("");
  }

  private BigDecimal weeklyPrice(List<String> row) {
    BigDecimal weekly = price(cell(row, 7));
    if (weekly.compareTo(BigDecimal.ZERO) > 0) {
      return weekly;
    }
    return price(cell(row, 4)).multiply(BigDecimal.valueOf(7));
  }

  private BigDecimal price(String value) {
    String normalized = clean(value).replace(",", "").replace("/-", "").replace("Rs.", "").replace("₹", "").trim();
    if (normalized.isBlank()) {
      return BigDecimal.ZERO;
    }
    return new BigDecimal(normalized);
  }

  private String imagePath(String value) {
    if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) {
      return value;
    }
    String basePath = imageBasePath.endsWith("/") ? imageBasePath : imageBasePath + "/";
    return basePath + value.replace("\\", "/").replace(":", "_").replace(" ", "%20");
  }

  private String cell(List<String> row, int index) {
    return index < row.size() ? row.get(index) : "";
  }

  private String clean(String value) {
    return value == null ? "" : value.trim();
  }

  private String normalize(String value) {
    return clean(value).toLowerCase(Locale.ROOT).replace(":", "").trim();
  }

  private boolean isImageHeader(String normalizedHeader) {
    String compact = normalizedHeader.replaceAll("\\s+", " ");
    return compact.equals("image")
        || compact.equals("image link")
        || compact.equals("image links")
        || compact.equals("image  link")
        || compact.equals("imge link")
        || compact.startsWith("link");
  }

  private String displayCategory(ProductCategory category) {
    return switch (category) {
      case CAMERAS -> "Cameras";
      case LENSES -> "Lenses";
      case LIGHTING -> "Lighting";
      case AUDIO -> "Audio Equipment";
      case TRIPODS_SUPPORT -> "Tripods";
      case ACCESSORIES -> "Accessories";
    };
  }
}
