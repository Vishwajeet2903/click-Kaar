package com.clickkaar.dto.content;

import java.time.LocalDateTime;

public record GalleryImageResponse(
    Long id,
    String imageUrl,
    String altText,
    boolean wide,
    boolean tall,
    boolean active,
    Integer displayOrder,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
