package com.clickkaar.dto.content;

import jakarta.validation.constraints.NotBlank;

public record StaticContentRequest(
    @NotBlank String pageKey,
    @NotBlank String content
) {
}
