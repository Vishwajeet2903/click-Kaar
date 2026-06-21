package com.clickkaar.dto.content;

import java.time.LocalDateTime;

public record CustomerReviewResponse(
    Long id,
    String name,
    String role,
    Integer rating,
    String quote,
    String avatar,
    LocalDateTime createdAt
) {
}
