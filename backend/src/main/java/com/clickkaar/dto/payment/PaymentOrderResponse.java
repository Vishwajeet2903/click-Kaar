package com.clickkaar.dto.payment;

import com.clickkaar.enums.PaymentStatus;

import java.math.BigDecimal;

public record PaymentOrderResponse(
    Long paymentId,
    String razorpayOrderId,
    BigDecimal amount,
    PaymentStatus status
) {
}
