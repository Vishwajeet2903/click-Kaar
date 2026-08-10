package com.clickkaar.dto.payment;

import com.fasterxml.jackson.annotation.JsonProperty;

public record RazorpayOrderResponse(
    @JsonProperty("order_id") String orderId,
    Long amount,
    String currency
) {
}
