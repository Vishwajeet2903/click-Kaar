package com.clickkaar.controller;

import com.clickkaar.dto.payment.CreatePaymentOrderRequest;
import com.clickkaar.dto.payment.PaymentOrderResponse;
import com.clickkaar.dto.payment.RefundRequest;
import com.clickkaar.dto.payment.VerifyPaymentRequest;
import com.clickkaar.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {
  private final PaymentService paymentService;

  @PostMapping("/orders")
  public PaymentOrderResponse createOrder(@Valid @RequestBody CreatePaymentOrderRequest request) {
    return paymentService.createOrder(request);
  }

  @PostMapping("/verify")
  public PaymentOrderResponse verify(@Valid @RequestBody VerifyPaymentRequest request) {
    return paymentService.verify(request);
  }

  @PostMapping("/refunds")
  @PreAuthorize("hasRole('ADMIN')")
  public Long refund(@Valid @RequestBody RefundRequest request) {
    return paymentService.refund(request);
  }
}
