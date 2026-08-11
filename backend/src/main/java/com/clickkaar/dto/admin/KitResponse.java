package com.clickkaar.dto.admin;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record KitResponse(
    Long id,
    String name,
    String description,
    String imageUrl,
    BigDecimal rent,
    boolean active,
    List<KitProductResponse> products,
    LocalDateTime createdAt
) {}