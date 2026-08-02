package com.clickkaar.service;

import com.clickkaar.dto.payment.CreatePaymentOrderRequest;
import com.clickkaar.dto.payment.PaymentOrderResponse;
import com.clickkaar.dto.payment.RefundRequest;
import com.clickkaar.dto.payment.VerifyPaymentRequest;
import com.clickkaar.entity.Booking;
import com.clickkaar.entity.Payment;
import com.clickkaar.entity.Refund;
import com.clickkaar.enums.BookingStatus;
import com.clickkaar.enums.PaymentStatus;
import com.clickkaar.enums.RefundStatus;
import com.clickkaar.exception.BadRequestException;
import com.clickkaar.exception.ResourceNotFoundException;
import com.clickkaar.repository.BookingRepository;
import com.clickkaar.repository.PaymentRepository;
import com.clickkaar.repository.RefundRepository;
import com.clickkaar.security.CustomUserDetails;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class PaymentService {
  private final BookingRepository bookingRepository;
  private final PaymentRepository paymentRepository;
  private final RefundRepository refundRepository;
  private final BookingService bookingService;

  @Value("${app.razorpay.key-id:}")
  private String razorpayKeyId;

  @Value("${app.razorpay.key-secret:}")
  private String razorpaySecret;

  @Transactional
  public PaymentOrderResponse createOrder(CreatePaymentOrderRequest request) {
    Booking booking = bookingRepository.findById(request.bookingId()).orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
    assertCanAccessBookingPayment(booking);
    validateRequestedAmount(booking, request);
    String razorpayOrderId = createRazorpayOrderId(booking);
    Payment payment = paymentRepository.save(Payment.builder()
        .booking(booking)
        .amount(booking.getTotalAmount())
        .type(request.type())
        .status(PaymentStatus.PENDING)
        .razorpayOrderId(razorpayOrderId)
        .build());
    return paymentOrderResponse(payment);
  }

  @Transactional
  public PaymentOrderResponse verify(VerifyPaymentRequest request) {
    Payment payment = paymentRepository.findByRazorpayOrderId(request.razorpayOrderId())
        .orElseThrow(() -> new ResourceNotFoundException("Payment order not found"));
    assertCanAccessBookingPayment(payment.getBooking());
    verifyRazorpaySignature(request);
    payment.setRazorpayPaymentId(request.razorpayPaymentId());
    payment.setRazorpaySignature(request.razorpaySignature());
    payment.setStatus(PaymentStatus.PAID);
    payment.getBooking().setStatus(BookingStatus.CONFIRMED);
    bookingService.sendBookingBillEmail(payment.getBooking(), PaymentStatus.PAID, "Razorpay online payment");
    return paymentOrderResponse(payment);
  }

  @Transactional
  public Long refund(RefundRequest request) {
    Payment payment = paymentRepository.findById(request.paymentId()).orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
    Refund refund = refundRepository.save(Refund.builder()
        .payment(payment)
        .amount(request.amount())
        .reason(request.reason())
        .status(RefundStatus.REQUESTED)
        .build());
    return refund.getId();
  }

  private void verifyRazorpaySignature(VerifyPaymentRequest request) {
    if (razorpaySecret == null || razorpaySecret.isBlank()) {
      return;
    }
    try {
      JSONObject attributes = new JSONObject();
      attributes.put("razorpay_order_id", request.razorpayOrderId());
      attributes.put("razorpay_payment_id", request.razorpayPaymentId());
      attributes.put("razorpay_signature", request.razorpaySignature());
      Utils.verifyPaymentSignature(attributes, razorpaySecret);
    } catch (Exception ex) {
      throw new BadRequestException("Invalid Razorpay payment signature");
    }
  }

  private void validateRequestedAmount(Booking booking, CreatePaymentOrderRequest request) {
    if (request.amount() != null && request.amount().compareTo(booking.getTotalAmount()) != 0) {
      throw new BadRequestException("Payment amount does not match the booking total");
    }
  }

  private void assertCanAccessBookingPayment(Booking booking) {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || !authentication.isAuthenticated()) {
      throw new AccessDeniedException("Login is required to pay for this booking");
    }

    boolean staffUser = authentication.getAuthorities().stream()
        .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN") || authority.getAuthority().equals("ROLE_MANAGER"));
    if (staffUser) {
      return;
    }

    Object principal = authentication.getPrincipal();
    if (principal instanceof CustomUserDetails userDetails
        && booking.getCustomer().getId().equals(userDetails.user().getId())) {
      return;
    }

    throw new AccessDeniedException("You cannot pay for another customer's booking");
  }

  private String createRazorpayOrderId(Booking booking) {
    if (razorpayKeyId == null || razorpayKeyId.isBlank() || razorpaySecret == null || razorpaySecret.isBlank()) {
      throw new BadRequestException("Razorpay credentials are not configured");
    }

    try {
      RazorpayClient razorpayClient = new RazorpayClient(razorpayKeyId, razorpaySecret);
      JSONObject orderRequest = new JSONObject();
      orderRequest.put("amount", booking.getTotalAmount().multiply(java.math.BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValueExact());
      orderRequest.put("currency", "INR");
      orderRequest.put("receipt", booking.getBookingNumber() + "-" + UUID.randomUUID().toString().substring(0, 8));
      Order order = razorpayClient.orders.create(orderRequest);
      return order.get("id");
    } catch (Exception exception) {
      throw new BadRequestException("Unable to create Razorpay order");
    }
  }

  private PaymentOrderResponse paymentOrderResponse(Payment payment) {
    return new PaymentOrderResponse(payment.getId(), razorpayKeyId, payment.getRazorpayOrderId(), payment.getAmount(), "INR", payment.getStatus());
  }
}
