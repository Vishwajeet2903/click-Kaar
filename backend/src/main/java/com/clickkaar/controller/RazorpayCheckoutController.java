package com.clickkaar.controller;

import com.clickkaar.dto.payment.CreateRazorpayOrderRequest;
import com.clickkaar.dto.payment.RazorpayOrderResponse;
import com.clickkaar.dto.payment.VerifyRazorpayPaymentRequest;
import com.clickkaar.dto.payment.VerifyRazorpayPaymentResponse;
import com.clickkaar.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RazorpayCheckoutController {
  private final PaymentService paymentService;

  @PostMapping("/create-order")
  public RazorpayOrderResponse createOrder(@Valid @RequestBody CreateRazorpayOrderRequest request) {
    return paymentService.createStandardOrder(request);
  }

  @PostMapping("/verify-payment")
  public VerifyRazorpayPaymentResponse verifyPayment(@Valid @RequestBody VerifyRazorpayPaymentRequest request) {
    return paymentService.verifyStandardPayment(request);
  }
}
