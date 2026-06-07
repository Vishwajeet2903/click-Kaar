package com.clickkaar.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record VerifyOtpRequest(
    @NotBlank String mobile,
    @NotBlank String code
) {
}
