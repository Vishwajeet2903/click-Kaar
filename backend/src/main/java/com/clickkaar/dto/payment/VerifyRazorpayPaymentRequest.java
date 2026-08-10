package com.clickkaar.dto.payment;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public record VerifyRazorpayPaymentRequest(
    @JsonProperty("razorpay_order_id") @NotBlank String razorpayOrderId,
    @JsonProperty("razorpay_payment_id") @NotBlank String razorpayPaymentId,
    @JsonProperty("razorpay_signature") @NotBlank String razorpaySignature
) {
}
