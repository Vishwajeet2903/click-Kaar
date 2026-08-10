package com.clickkaar.service;

import com.clickkaar.dto.payment.CreatePaymentOrderRequest;
import com.clickkaar.dto.payment.CreateRazorpayOrderRequest;
import com.clickkaar.dto.payment.PaymentOrderResponse;
import com.clickkaar.dto.payment.RazorpayOrderResponse;
import com.clickkaar.dto.payment.RefundRequest;
import com.clickkaar.dto.payment.VerifyPaymentRequest;
import com.clickkaar.dto.payment.VerifyRazorpayPaymentRequest;
import com.clickkaar.dto.payment.VerifyRazorpayPaymentResponse;
import com.clickkaar.entity.Booking;
import com.clickkaar.entity.Payment;
import com.clickkaar.entity.Refund;
import com.clickkaar.enums.BookingStatus;
import com.clickkaar.enums.PaymentStatus;
import com.clickkaar.enums.RefundStatus;
import com.clickkaar.exception.BadRequestException;
import com.clickkaar.exception.RazorpayApiException;
import com.clickkaar.exception.RazorpayAuthenticationException;
import com.clickkaar.exception.ResourceNotFoundException;
import com.clickkaar.repository.BookingRepository;
import com.clickkaar.repository.PaymentRepository;
import com.clickkaar.repository.RefundRepository;
import com.clickkaar.security.CustomUserDetails;
import com.clickkaar.util.BusinessIdFormatter;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {
  private static final long MINIMUM_RAZORPAY_AMOUNT_PAISE = 100L;

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

  public RazorpayOrderResponse createStandardOrder(CreateRazorpayOrderRequest request) {
    long amount = request.amount();
    if (amount < MINIMUM_RAZORPAY_AMOUNT_PAISE) {
      throw new BadRequestException("Amount must be at least 100 paise");
    }

    String currency = request.currency() == null || request.currency().isBlank()
        ? "INR"
        : request.currency().trim().toUpperCase(Locale.ROOT);
    String receipt = request.receipt() == null || request.receipt().isBlank()
        ? "receipt-" + UUID.randomUUID().toString().substring(0, 8)
        : request.receipt().trim();

    Order order = createRazorpayOrder(amount, currency, receipt);
    return new RazorpayOrderResponse(order.get("id"), ((Number) order.get("amount")).longValue(), order.get("currency"));
  }

  @Transactional
  public PaymentOrderResponse verify(VerifyPaymentRequest request) {
    Payment payment = paymentRepository.findByRazorpayOrderId(request.razorpayOrderId())
        .orElseThrow(() -> new ResourceNotFoundException("Payment order not found"));
    assertCanAccessBookingPayment(payment.getBooking());
    verifyRazorpaySignature(request.razorpayOrderId(), request.razorpayPaymentId(), request.razorpaySignature());
    payment.setRazorpayPaymentId(request.razorpayPaymentId());
    payment.setRazorpaySignature(request.razorpaySignature());
    payment.setStatus(PaymentStatus.PAID);
    payment.getBooking().setStatus(BookingStatus.CONFIRMED);
    bookingService.sendBookingBillEmail(payment.getBooking(), PaymentStatus.PAID, "Razorpay online payment");
    return paymentOrderResponse(payment);
  }

  public VerifyRazorpayPaymentResponse verifyStandardPayment(VerifyRazorpayPaymentRequest request) {
    verifyRazorpaySignature(request.razorpayOrderId(), request.razorpayPaymentId(), request.razorpaySignature());
    return new VerifyRazorpayPaymentResponse(true);
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

  private void verifyRazorpaySignature(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
    assertRazorpayCredentialsConfigured();
    try {
      String payload = razorpayOrderId + "|" + razorpayPaymentId;
      Mac hmac = Mac.getInstance("HmacSHA256");
      hmac.init(new SecretKeySpec(razorpaySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
      String generatedSignature = HexFormat.of().formatHex(hmac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
      boolean matches = MessageDigest.isEqual(
          generatedSignature.getBytes(StandardCharsets.UTF_8),
          razorpaySignature.getBytes(StandardCharsets.UTF_8)
      );
      if (!matches) {
        throw new BadRequestException("Invalid Razorpay payment signature");
      }
    } catch (BadRequestException exception) {
      throw exception;
    } catch (Exception exception) {
      log.warn("Razorpay signature verification failed for order {}", razorpayOrderId, exception);
      throw new BadRequestException("Invalid Razorpay payment signature");
    }
  }

  private void validateRequestedAmount(Booking booking, CreatePaymentOrderRequest request) {
    if (booking.getTotalAmount() == null || booking.getTotalAmount().signum() <= 0) {
      throw new BadRequestException("Booking total must be greater than zero");
    }
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
    long amountInPaise = booking.getTotalAmount()
        .multiply(java.math.BigDecimal.valueOf(100))
        .setScale(0, RoundingMode.HALF_UP)
        .longValueExact();
    if (amountInPaise < MINIMUM_RAZORPAY_AMOUNT_PAISE) {
      throw new BadRequestException("Amount must be at least 100 paise");
    }

    Order order = createRazorpayOrder(
        amountInPaise,
        "INR",
        booking.getBookingNumber() + "-" + UUID.randomUUID().toString().substring(0, 8)
    );
    log.info("Created Razorpay order {} for booking {}", order.get("id"), booking.getBookingNumber());
    return order.get("id");
  }

  private Order createRazorpayOrder(long amount, String currency, String receipt) {
    assertRazorpayCredentialsConfigured();
    try {
      RazorpayClient razorpayClient = new RazorpayClient(razorpayKeyId, razorpaySecret);
      JSONObject orderRequest = new JSONObject();
      orderRequest.put("amount", amount);
      orderRequest.put("currency", currency);
      orderRequest.put("receipt", receipt);
      return razorpayClient.orders.create(orderRequest);
    } catch (RazorpayException exception) {
      log.warn("Unable to create Razorpay order for receipt {} and amount {}", receipt, amount, exception);
      if (isRazorpayAuthFailure(exception)) {
        throw new RazorpayAuthenticationException("Razorpay authentication failed");
      }
      throw new RazorpayApiException("Unable to create Razorpay order");
    } catch (Exception exception) {
      log.warn("Unable to create Razorpay order for receipt {} and amount {}", receipt, amount, exception);
      throw new RazorpayApiException("Unable to create Razorpay order");
    }
  }

  private void assertRazorpayCredentialsConfigured() {
    if (razorpayKeyId == null || razorpayKeyId.isBlank() || razorpaySecret == null || razorpaySecret.isBlank()) {
      throw new RazorpayAuthenticationException("Razorpay credentials are not configured");
    }
  }

  private boolean isRazorpayAuthFailure(RazorpayException exception) {
    String message = exception.getMessage();
    return message != null && (message.toLowerCase(Locale.ROOT).contains("auth") || message.contains("401"));
  }

  private PaymentOrderResponse paymentOrderResponse(Payment payment) {
    return new PaymentOrderResponse(payment.getId(), BusinessIdFormatter.paymentNumber(payment), razorpayKeyId, payment.getRazorpayOrderId(), payment.getAmount(), "INR", payment.getStatus());
  }
}
