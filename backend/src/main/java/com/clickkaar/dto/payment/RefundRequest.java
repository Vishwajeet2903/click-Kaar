package com.clickkaar.dto.payment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record RefundRequest(
    @NotNull Long paymentId,
    @NotNull BigDecimal amount,
    @NotBlank String reason
) {
}
