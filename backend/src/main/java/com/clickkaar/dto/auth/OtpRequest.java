package com.clickkaar.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record OtpRequest(@NotBlank String mobile) {
}
