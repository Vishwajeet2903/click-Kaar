package com.clickkaar.dto.admin;

import java.math.BigDecimal;

public record KitProductResponse(
    Long id,
    String name,
    String brand,
    String category,
    BigDecimal dailyPrice
) {}