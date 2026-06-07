package com.clickkaar.dto.content;

import jakarta.validation.constraints.NotBlank;

public record FaqRequest(
    @NotBlank String question,
    @NotBlank String answer,
    boolean active,
    int displayOrder
) {
}
