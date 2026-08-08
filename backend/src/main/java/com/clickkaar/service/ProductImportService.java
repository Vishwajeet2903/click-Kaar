package com.clickkaar.service;

import com.clickkaar.dto.product.ProductImportResponse;
import com.clickkaar.dto.product.ProductRequest;
import com.clickkaar.dto.product.ProductResponse;
import com.clickkaar.entity.Category;
import com.clickkaar.enums.AvailabilityStatus;
import com.clickkaar.enums.ProductCategory;
import com.clickkaar.exception.BadRequestException;
import com.clickkaar.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProductImportService {
  private static final int MAX_ERRORS = 20;
  private static final List<ProductCategory> CATEGORY_ORDER = List.of(
      ProductCategory.CAMERAS,
      ProductCategory.LENSES,
      ProductCategory.LIGHTING,
      ProductCategory.AUDIO,
      ProductCategory.TRIPODS_SUPPORT,
      ProductCategory.ACCESSORIES
  );

  private final ProductService productService;
  private final CategoryRepository categoryRepository;

  @Transactional
  public ProductImportResponse importProducts(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new BadRequestException("Please upload an Excel or CSV file.");
    }

    List<List<String>> rows = readRows(file);
    if (rows.isEmpty()) {
      throw new BadRequestException("The uploaded sheet is empty.");
    }

    ensureCategories();
    List<ProductResponse> imported = new ArrayList<>();
    List<String> errors = new ArrayList<>();
    Map<Integer, String> headers = new LinkedHashMap<>();
    ProductCategory currentCategory = ProductCategory.ACCESSORIES;
    String currentSection = "";
    String lastBrand = "";
    int skipped = 0;

    for (int rowIndex = 0; rowIndex < rows.size(); rowIndex += 1) {
      List<String> row = rows.get(rowIndex);
      if (isBlankRow(row)) {
        continue;
      }

      if (isSectionHeader(row)) {
        currentSection = clean(cell(row, 0));
        currentCategory = mapCategory(currentSection);
        headers = readHeaders(row);
        lastBrand = "";
        continue;
      }

      if (isFlatHeader(row)) {
        headers = readHeaders(row);
        currentSection = valueFor(row, headers, "category");
        currentCategory = currentSection.isBlank() ? currentCategory : mapCategory(currentSection);
        lastBrand = "";
        continue;
      }

      if (headers.isEmpty()) {
        skipped += 1;
        addError(errors, rowIndex + 1, "Header row was not found before this product row.");
        continue;
      }

      try {
        String name = firstValue(row, headers, List.of("product name", "product", "name", "equipment", "model"), 2);
        if (name.isBlank()) {
          skipped += 1;
          continue;
        }

        String brand = firstValue(row, headers, List.of("brand", "make"), 1);
        if (!brand.isBlank()) {
          lastBrand = brand;
        } else {
          brand = lastBrand.isBlank() ? fallbackBrand(currentSection) : lastBrand;
        }

        String categoryValue = firstValue(row, headers, List.of("category", "section", "type"), -1);
        ProductCategory category = categoryValue.isBlank() || isLikelySectionPlaceholder(categoryValue)
            ? currentCategory
            : mapCategory(categoryValue);

        BigDecimal dailyPrice = price(firstValue(row, headers, List.of("daily price", "rent per day", "per day", "day price", "price", "rent"), 4));
        BigDecimal weeklyPrice = price(firstValue(row, headers, List.of("weekly price", "rent per week", "per week", "week price"), 7));
        if (weeklyPrice.compareTo(BigDecimal.ZERO) <= 0) {
          weeklyPrice = dailyPrice.multiply(BigDecimal.valueOf(7));
        }

        List<String> images = images(row, headers);
        String description = firstValue(row, headers, List.of("description", "short description", "details"), -1);
        String fullDescription = fullDescription(row, headers, description);
        ProductRequest request = new ProductRequest(
            name,
            brand,
            category,
            limit(description.isBlank() ? brand + " rental equipment: " + name : description, 500),
            fullDescription,
            specs(row, headers),
            dailyPrice,
            weeklyPrice,
            date(firstValue(row, headers, List.of("warranty date", "warranty", "warranty till"), -1)),
            firstValue(row, headers, List.of("invoice url", "invoice", "bill", "bill url"), -1),
            imageLink(images, 0),
            imageLink(images, 1),
            imageLink(images, 2),
            integer(firstValue(row, headers, List.of("stock", "quantity", "qty", "units"), -1), 1),
            availability(firstValue(row, headers, List.of("availability", "status", "availability status"), -1)),
            images
        );
        imported.add(productService.create(request));
      } catch (RuntimeException ex) {
        skipped += 1;
        addError(errors, rowIndex + 1, ex.getMessage());
      }
    }

    if (imported.isEmpty()) {
      throw new BadRequestException(errors.isEmpty() ? "No products were found in the uploaded sheet." : errors.get(0));
    }

    return new ProductImportResponse(imported.size(), skipped, errors, imported);
  }

  private List<List<String>> readRows(MultipartFile file) {
    String filename = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
    try {
      if (filename.endsWith(".csv") || contentType(file).contains("csv")) {
        return parseCsv(file);
      }
      if (filename.endsWith(".xlsx") || filename.endsWith(".xls") || contentType(file).contains("spreadsheet") || contentType(file).contains("excel")) {
        return parseWorkbook(file);
      }
    } catch (Exception ex) {
      throw new BadRequestException("Could not read the uploaded sheet: " + ex.getMessage());
    }
    throw new BadRequestException("Unsupported file type. Upload .xlsx, .xls, or .csv.");
  }

  private List<List<String>> parseWorkbook(MultipartFile file) throws Exception {
    List<List<String>> rows = new ArrayList<>();
    DataFormatter formatter = new DataFormatter();
    try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
      Sheet sheet = workbook.getSheetAt(0);
      for (Row row : sheet) {
        List<String> values = new ArrayList<>();
        int lastCell = Math.max(row.getLastCellNum(), 0);
        for (int index = 0; index < lastCell; index += 1) {
          Cell cell = row.getCell(index, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
          values.add(cell == null ? "" : formatter.formatCellValue(cell));
        }
        rows.add(values);
      }
    }
    return rows;
  }

  private List<List<String>> parseCsv(MultipartFile file) throws Exception {
    try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
      StringBuilder csv = new StringBuilder();
      String line;
      while ((line = reader.readLine()) != null) {
        csv.append(line).append('\n');
      }
      return parseCsv(csv.toString());
    }
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
      } else if (current == '"') {
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
    return !cell(row, 0).isBlank() && normalize(cell(row, 1)).equals("brand") && normalize(cell(row, 2)).contains("product name");
  }

  private boolean isFlatHeader(List<String> row) {
    List<String> normalized = row.stream().map(this::normalize).toList();
    return normalized.stream().anyMatch(value -> value.equals("product name") || value.equals("name"))
        && normalized.stream().anyMatch(value -> value.equals("brand") || value.equals("category") || value.contains("price"));
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

  private String firstValue(List<String> row, Map<Integer, String> headers, List<String> aliases, int fallbackIndex) {
    for (String alias : aliases) {
      String value = valueFor(row, headers, alias);
      if (!value.isBlank()) {
        return value;
      }
    }
    return fallbackIndex >= 0 ? clean(cell(row, fallbackIndex)) : "";
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

  private String fullDescription(List<String> row, Map<Integer, String> headers, String description) {
    String full = firstValue(row, headers, List.of("full description", "long description"), -1);
    String bestFor = firstValue(row, headers, List.of("best for", "best"), -1);
    String base = full.isBlank() ? description : full;
    return bestFor.isBlank() ? base : (base.isBlank() ? "Best for: " + bestFor : base + "\n\nBest for: " + bestFor);
  }

  private String specs(List<String> row, Map<Integer, String> headers) {
    List<String> lines = new ArrayList<>();
    for (Map.Entry<Integer, String> entry : headers.entrySet()) {
      int index = entry.getKey();
      String header = entry.getValue();
      String normalized = normalize(header);
      if (isKnownHeader(normalized) || isImageHeader(normalized)) {
        continue;
      }
      String value = clean(cell(row, index));
      if (!value.isBlank()) {
        lines.add(header + ": " + value);
      }
    }
    String explicit = firstValue(row, headers, List.of("specs", "specifications"), -1);
    if (!explicit.isBlank()) {
      lines.add(0, explicit);
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
      splitImages(clean(cell(row, entry.getKey()))).forEach(images::add);
    }
    if (images.isEmpty()) {
      splitImages(firstValue(row, headers, List.of("image", "image link", "image url"), 8)).forEach(images::add);
    }
    return images.stream().distinct().limit(3).toList();
  }

  private List<String> splitImages(String value) {
    if (value.isBlank()) {
      return List.of();
    }
    List<String> images = new ArrayList<>();
    for (String part : value.split("[|;]")) {
      String image = clean(part);
      if (!image.isBlank()) {
        images.add(image);
      }
    }
    return images;
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

  private ProductCategory mapCategory(String value) {
    String normalized = normalize(value);
    if (normalized.contains("camera")) return ProductCategory.CAMERAS;
    if (normalized.contains("lens")) return ProductCategory.LENSES;
    if (normalized.contains("light") || normalized.contains("modifi") || normalized.contains("reflector")) return ProductCategory.LIGHTING;
    if (normalized.contains("audio") || normalized.contains("mic")) return ProductCategory.AUDIO;
    if (normalized.contains("tripod") || normalized.contains("support")) return ProductCategory.TRIPODS_SUPPORT;
    if (normalized.equals("cameras")) return ProductCategory.CAMERAS;
    try {
      return ProductCategory.valueOf(normalized.toUpperCase(Locale.ROOT).replace(" ", "_"));
    } catch (IllegalArgumentException ex) {
      return ProductCategory.ACCESSORIES;
    }
  }

  private AvailabilityStatus availability(String value) {
    String normalized = normalize(value);
    if (normalized.contains("maintenance")) return AvailabilityStatus.MAINTENANCE;
    if (normalized.contains("unavailable") || normalized.contains("blocked")) return AvailabilityStatus.UNAVAILABLE;
    return AvailabilityStatus.AVAILABLE;
  }

  private BigDecimal price(String value) {
    String normalized = clean(value).replace(",", "").replace("/-", "").replace("Rs.", "").replace("?", "").trim();
    if (normalized.isBlank()) {
      return BigDecimal.ZERO;
    }
    return new BigDecimal(normalized);
  }

  private Integer integer(String value, int fallback) {
    String normalized = clean(value).replace(",", "");
    if (normalized.isBlank()) {
      return fallback;
    }
    return Math.max(0, new BigDecimal(normalized).intValue());
  }

  private LocalDate date(String value) {
    String clean = clean(value);
    if (clean.isBlank()) {
      return null;
    }
    List<DateTimeFormatter> formats = List.of(
        DateTimeFormatter.ISO_LOCAL_DATE,
        DateTimeFormatter.ofPattern("d/M/yyyy"),
        DateTimeFormatter.ofPattern("d-M-yyyy"),
        DateTimeFormatter.ofPattern("M/d/yyyy")
    );
    for (DateTimeFormatter format : formats) {
      try {
        return LocalDate.parse(clean, format);
      } catch (DateTimeParseException ignored) {
      }
    }
    return null;
  }

  private boolean isKnownHeader(String normalized) {
    return normalized.contains("product") || normalized.equals("name") || normalized.equals("brand") || normalized.equals("category")
        || normalized.contains("price") || normalized.contains("rent") || normalized.contains("description") || normalized.contains("best")
        || normalized.contains("stock") || normalized.contains("quantity") || normalized.contains("qty") || normalized.contains("warranty")
        || normalized.contains("invoice") || normalized.contains("bill") || normalized.contains("status") || normalized.contains("availability")
        || normalized.contains("spec");
  }

  private boolean isImageHeader(String normalized) {
    String compact = normalized.replaceAll("\s+", " ");
    return compact.equals("image") || compact.equals("image link") || compact.equals("image url") || compact.equals("image links")
        || compact.equals("imge link") || compact.startsWith("link");
  }

  private boolean isBlankRow(List<String> row) {
    return row.stream().allMatch(value -> clean(value).isBlank());
  }

  private boolean isLikelySectionPlaceholder(String value) {
    String normalized = normalize(value);
    return normalized.equals("camera") || normalized.equals("cameras") || normalized.equals("lens") || normalized.equals("lenses")
        || normalized.equals("lighting") || normalized.equals("audio") || normalized.equals("tripods") || normalized.equals("accessories");
  }

  private String imageLink(List<String> images, int index) {
    return index < images.size() ? images.get(index) : null;
  }

  private String cell(List<String> row, int index) {
    return index >= 0 && index < row.size() ? row.get(index) : "";
  }

  private String clean(String value) {
    return value == null ? "" : value.trim();
  }

  private String normalize(String value) {
    return clean(value).toLowerCase(Locale.ROOT).replace(":", "").trim();
  }

  private String limit(String value, int maxLength) {
    return value.length() > maxLength ? value.substring(0, maxLength - 3) + "..." : value;
  }

  private String fallbackBrand(String currentSection) {
    String section = clean(currentSection);
    return section.isBlank() ? "Click-Kaar" : section;
  }

  private String contentType(MultipartFile file) {
    return file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
  }

  private void addError(List<String> errors, int rowNumber, String message) {
    if (errors.size() < MAX_ERRORS) {
      errors.add("Row " + rowNumber + ": " + message);
    }
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
