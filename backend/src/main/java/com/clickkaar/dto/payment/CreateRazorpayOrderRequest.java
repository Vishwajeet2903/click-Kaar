package com.clickkaar.dto.payment;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CreateRazorpayOrderRequest(
    @NotNull @Min(100) Long amount,
    String currency,
    String receipt
) {
}
