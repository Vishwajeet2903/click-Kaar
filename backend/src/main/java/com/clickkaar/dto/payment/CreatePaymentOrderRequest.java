package com.clickkaar.dto.payment;

import com.clickkaar.enums.PaymentType;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreatePaymentOrderRequest(
    @NotNull Long bookingId,
    @NotNull BigDecimal amount,
    @NotNull PaymentType type
) {
}
