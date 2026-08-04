package com.clickkaar.dto.content;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record GalleryImageRequest(
    @NotBlank String imageUrl,
    @NotBlank String altText,
    boolean wide,
    boolean tall,
    @NotNull Integer displayOrder,
    Boolean active
) {}
