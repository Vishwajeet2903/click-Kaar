package com.clickkaar.dto.product;

import com.clickkaar.enums.AvailabilityStatus;
import com.clickkaar.enums.ProductCategory;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ProductResponse(
    Long id,
    String name,
    String brand,
    ProductCategory category,
    String shortDescription,
    String fullDescription,
    String specs,
    BigDecimal dailyPrice,
    BigDecimal weeklyPrice,
    LocalDate warrantyDate,
    String invoiceUrl,
    String imageLink,
    String link1,
    String link2,
    AvailabilityStatus availabilityStatus,
    List<String> images
) {
}
