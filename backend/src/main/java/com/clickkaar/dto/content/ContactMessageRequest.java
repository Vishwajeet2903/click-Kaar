package com.clickkaar.dto.content;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ContactMessageRequest(
    @NotBlank String name,
    @Email @NotBlank String email,
    String phone,
    @NotBlank String message,
    String recaptchaToken
) {
}
