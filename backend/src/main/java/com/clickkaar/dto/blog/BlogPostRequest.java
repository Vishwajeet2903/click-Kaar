package com.clickkaar.dto.blog;

import com.clickkaar.enums.BlogStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record BlogPostRequest(
    @NotBlank String title,
    @NotBlank String slug,
    String coverImage,
    String authorName,
    LocalDate publishDate,
    String category,
    String tags,
    String seoTitle,
    String seoDescription,
    String seoKeywords,
    String content,
    @NotNull BlogStatus status
) {
}
