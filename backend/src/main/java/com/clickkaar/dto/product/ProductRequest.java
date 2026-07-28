package com.clickkaar.dto.product;

import com.clickkaar.enums.AvailabilityStatus;
import com.clickkaar.enums.ProductCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ProductRequest(
    @NotBlank String name,
    @NotBlank String brand,
    @NotNull ProductCategory category,
    String shortDescription,
    String fullDescription,
    String specs,
    @NotNull @DecimalMin("0.0") BigDecimal dailyPrice,
    @NotNull @DecimalMin("0.0") BigDecimal weeklyPrice,
    LocalDate warrantyDate,
    String invoiceUrl,
    String imageLink,
    String link1,
    String link2,
    AvailabilityStatus availabilityStatus,
    List<String> images
) {
}
