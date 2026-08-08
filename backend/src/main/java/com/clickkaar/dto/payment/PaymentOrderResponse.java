package com.clickkaar.dto.payment;

import com.clickkaar.enums.PaymentStatus;

import java.math.BigDecimal;

public record PaymentOrderResponse(
    Long paymentId,
    String paymentNumber,
    String razorpayKeyId,
    String razorpayOrderId,
    BigDecimal amount,
    String currency,
    PaymentStatus status
) {
}
