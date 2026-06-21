package com.clickkaar.dto.content;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CustomerReviewRequest(
    @NotBlank @Size(max = 120) String name,
    @NotBlank @Size(max = 120) String role,
    @NotNull @Min(1) @Max(5) Integer rating,
    @NotBlank @Size(max = 600) String quote
) {
}
