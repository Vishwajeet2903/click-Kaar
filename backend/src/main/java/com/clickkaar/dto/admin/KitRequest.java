package com.clickkaar.dto.admin;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record KitRequest(
    @NotBlank String name,
    @NotBlank String description,
    @NotBlank String imageUrl,
    @NotNull @DecimalMin("1.00") BigDecimal rent,
    @NotEmpty List<Long> productIds,
    Boolean active
) {}