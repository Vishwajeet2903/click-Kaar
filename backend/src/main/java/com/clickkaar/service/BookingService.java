package com.clickkaar.service;

import com.clickkaar.dto.booking.BookingRequest;
import com.clickkaar.dto.booking.BookingItemRequest;
import com.clickkaar.dto.booking.BookingResponse;
import com.clickkaar.dto.booking.AvailabilityResponse;
import com.clickkaar.dto.booking.BlockedDateRangeResponse;
import com.clickkaar.dto.booking.CouponPreviewResponse;
import com.clickkaar.entity.Booking;
import com.clickkaar.entity.BookingItem;
import com.clickkaar.entity.Coupon;
import com.clickkaar.entity.Product;
import com.clickkaar.entity.User;
import com.clickkaar.enums.AvailabilityStatus;
import com.clickkaar.enums.BookingStatus;
import com.clickkaar.enums.PaymentStatus;
import com.clickkaar.exception.BadRequestException;
import com.clickkaar.exception.ResourceNotFoundException;
import com.clickkaar.repository.BookingRepository;
import com.clickkaar.repository.CouponRepository;
import com.clickkaar.repository.ProductRepository;
import com.clickkaar.repository.StaticContentRepository;
import com.clickkaar.repository.UserRepository;
import com.clickkaar.security.CustomUserDetails;
import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {
  private final BookingRepository bookingRepository;
  private final ProductRepository productRepository;
  private final UserRepository userRepository;
  private final StaticContentRepository staticContentRepository;
  private final CouponRepository couponRepository;
  private final JavaMailSender mailSender;
  private static final DateTimeFormatter DISPLAY_DATE = DateTimeFormatter.ofPattern("dd MMM yyyy");

  @Value("${spring.mail.username:}")
  private String mailUsername;

  @Value("${spring.mail.password:}")
  private String mailPassword;

  @Value("${app.frontend.login-url:https://clickkaar.com/login}")
  private String loginUrl;

  @Transactional
  public BookingResponse create(BookingRequest request) {
    if (request.rentalEndDate().isBefore(request.rentalStartDate())) {
      throw new BadRequestException("Rental end date must be after start date");
    }
    int days = (int) ChronoUnit.DAYS.between(request.rentalStartDate(), request.rentalEndDate()) + 1;
    User customer = userRepository.findById(request.customerId()).orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
    BookingStatus initialStatus = normalizedPaymentMethod(request.paymentMethod()).equals("razorpay")
        ? BookingStatus.PENDING
        : BookingStatus.CONFIRMED;
    Booking booking = Booking.builder()
        .bookingNumber("CK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
        .customer(customer)
        .rentalStartDate(request.rentalStartDate())
        .rentalEndDate(request.rentalEndDate())
        .rentalDays(days)
        .totalAmount(BigDecimal.ZERO)
        .status(initialStatus)
        .build();

    Map<Long, Long> requestedUnitsByProduct = request.items().stream()
        .collect(Collectors.groupingBy(BookingItemRequest::productId, Collectors.counting()));
    Map<Long, Product> productsById = new HashMap<>();
    for (Map.Entry<Long, Long> entry : requestedUnitsByProduct.entrySet()) {
      Product product = productRepository.findById(entry.getKey()).orElseThrow(() -> new ResourceNotFoundException("Product not found"));
      productsById.put(entry.getKey(), product);
      if (isRangeFullyBooked(product, request.rentalStartDate(), request.rentalEndDate(), entry.getValue().intValue())) {
        throw new BadRequestException(unavailableMessage(product.getName(), request.rentalStartDate(), request.rentalEndDate()));
      }
    }

    BigDecimal rentalSubtotal = BigDecimal.ZERO;
    for (var item : request.items()) {
      Product product = productsById.get(item.productId());
      BigDecimal lineTotal = product.getDailyPrice().multiply(BigDecimal.valueOf(days));
      booking.getItems().add(BookingItem.builder()
          .booking(booking)
          .product(product)
          .dailyPrice(product.getDailyPrice())
          .lineTotal(lineTotal)
          .build());
      rentalSubtotal = rentalSubtotal.add(lineTotal);
    }
    BigDecimal securityDeposit = rentalSubtotal.multiply(BigDecimal.valueOf(0.3)).setScale(0, RoundingMode.HALF_UP);
    booking.setTotalAmount(applyCouponDiscount(rentalSubtotal.add(securityDeposit), request.couponCode()));
    Booking saved = bookingRepository.save(booking);
    if (shouldSendBillOnCreate(request.paymentMethod())) {
      sendBookingBillEmail(saved, PaymentStatus.PENDING, displayPaymentMethod(request.paymentMethod()));
    }
    return toResponse(saved);
  }

  public AvailabilityResponse availability(Long productId, LocalDate startDate, LocalDate endDate) {
    if (endDate.isBefore(startDate)) {
      throw new BadRequestException("Rental end date must be after start date");
    }

    Product product = productRepository.findById(productId).orElseThrow(() -> new ResourceNotFoundException("Product not found"));
    if (isRangeFullyBooked(product, startDate, endDate, 1)) {
      return new AvailabilityResponse(false, unavailableMessage(product.getName(), startDate, endDate));
    }

    return new AvailabilityResponse(true, product.getName() + " is available for " + dateRange(startDate, endDate) + ".");
  }

  @Transactional(readOnly = true)
  public List<BlockedDateRangeResponse> blockedRanges(Long productId) {
    Product product = productRepository.findById(productId).orElseThrow(() -> new ResourceNotFoundException("Product not found"));
    LocalDate today = LocalDate.now();
    LocalDate horizon = today.plusMonths(12);
    Map<LocalDate, Integer> bookedUnits = bookedUnitsByDate(product.getId(), today, horizon);
    int stock = availableStock(product);

    List<BlockedDateRangeResponse> ranges = new ArrayList<>();
    LocalDate rangeStart = null;
    LocalDate previousBlocked = null;
    for (LocalDate day = today; !day.isAfter(horizon); day = day.plusDays(1)) {
      boolean blocked = bookedUnits.getOrDefault(day, 0) >= stock;
      if (blocked && rangeStart == null) {
        rangeStart = day;
      }
      if (!blocked && rangeStart != null) {
        ranges.add(new BlockedDateRangeResponse(rangeStart, previousBlocked));
        rangeStart = null;
      }
      if (blocked) {
        previousBlocked = day;
      }
    }
    if (rangeStart != null) {
      ranges.add(new BlockedDateRangeResponse(rangeStart, previousBlocked));
    }
    return ranges;
  }

  @Transactional(readOnly = true)
  public CouponPreviewResponse couponPreview(String couponCode) {
    Coupon coupon = activeCoupon(couponCode);
    return new CouponPreviewResponse(coupon.getCode(), coupon.getDiscountPercent());
  }

  @Transactional(readOnly = true)
  public List<BookingResponse> all() {
    return bookingRepository.findAll().stream().map(this::toResponse).toList();
  }

  @Transactional(readOnly = true)
  public List<BookingResponse> byCustomer(Long customerId) {
    return bookingRepository.findByCustomerId(customerId).stream().map(this::toResponse).toList();
  }

  @Transactional
  public BookingResponse updateStatus(Long bookingId, BookingStatus status) {
    Booking booking = bookingRepository.findById(bookingId).orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
    booking.setStatus(status);
    return toResponse(booking);
  }

  @Transactional
  public BookingResponse cancelPending(Long bookingId) {
    Booking booking = bookingRepository.findById(bookingId).orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
    assertCanAccessBooking(booking);
    if (booking.getStatus() != BookingStatus.PENDING && booking.getStatus() != BookingStatus.PAYMENT_PENDING) {
      throw new BadRequestException("Only pending bookings can be cancelled");
    }
    booking.setStatus(BookingStatus.CANCELLED);
    return toResponse(booking);
  }

  private BookingResponse toResponse(Booking booking) {
    return new BookingResponse(
        booking.getId(),
        booking.getBookingNumber(),
        booking.getCustomer().getId(),
        booking.getRentalStartDate(),
        booking.getRentalEndDate(),
        booking.getRentalDays(),
        booking.getTotalAmount(),
        booking.getStatus(),
        booking.getItems().stream().map(item -> item.getProduct().getName()).toList()
    );
  }

  private String unavailableMessage(String productName, LocalDate startDate, LocalDate endDate) {
    return productName + " is already booked between " + dateRange(startDate, endDate) + ". Please choose another date range.";
  }

  private boolean isRangeFullyBooked(Product product, LocalDate startDate, LocalDate endDate, int requestedUnits) {
    int stock = availableStock(product);
    if (stock <= 0 || requestedUnits > stock) {
      return true;
    }

    Map<LocalDate, Integer> bookedUnits = bookedUnitsByDate(product.getId(), startDate, endDate);
    for (LocalDate day = startDate; !day.isAfter(endDate); day = day.plusDays(1)) {
      if (bookedUnits.getOrDefault(day, 0) + requestedUnits > stock) {
        return true;
      }
    }
    return false;
  }

  private void assertCanAccessBooking(Booking booking) {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || !authentication.isAuthenticated()) {
      throw new AccessDeniedException("Login is required to update this booking");
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

    throw new AccessDeniedException("You cannot update another customer's booking");
  }

  private Map<LocalDate, Integer> bookedUnitsByDate(Long productId, LocalDate startDate, LocalDate endDate) {
    Map<LocalDate, Integer> bookedUnits = new HashMap<>();
    for (Booking booking : bookingRepository.findOverlappingBookingsForProduct(productId, startDate, endDate)) {
      int units = (int) booking.getItems().stream()
          .filter(item -> item.getProduct().getId().equals(productId))
          .count();
      LocalDate start = booking.getRentalStartDate().isBefore(startDate) ? startDate : booking.getRentalStartDate();
      LocalDate end = booking.getRentalEndDate().isAfter(endDate) ? endDate : booking.getRentalEndDate();
      for (LocalDate day = start; !day.isAfter(end); day = day.plusDays(1)) {
        bookedUnits.merge(day, units, Integer::sum);
      }
    }
    return bookedUnits;
  }

  private int availableStock(Product product) {
    return Math.max(0, product.getStock() == null ? defaultStock(product.getAvailabilityStatus()) : product.getStock());
  }

  private int defaultStock(AvailabilityStatus status) {
    return status == AvailabilityStatus.AVAILABLE ? 1 : 0;
  }

  private BigDecimal applyCouponDiscount(BigDecimal total, String couponCode) {
    String normalizedCode = couponCode == null ? "" : couponCode.trim();
    if (normalizedCode.isBlank()) {
      return total;
    }

    Coupon coupon = activeCoupon(normalizedCode);
    BigDecimal discount = total
        .multiply(coupon.getDiscountPercent())
        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    coupon.setUsedCount(usedCount(coupon) + 1);
    return total.subtract(discount).max(BigDecimal.ZERO);
  }

  private Coupon activeCoupon(String couponCode) {
    String normalizedCode = couponCode == null ? "" : couponCode.trim();
    if (normalizedCode.isBlank()) {
      throw new BadRequestException("Enter a coupon code");
    }
    Coupon coupon = couponRepository.findByCodeIgnoreCaseAndActiveTrue(normalizedCode)
        .orElseThrow(() -> new BadRequestException("Coupon code is invalid or inactive"));
    if (coupon.getValidUntil() != null && coupon.getValidUntil().isBefore(LocalDate.now())) {
      throw new BadRequestException("Coupon code has expired");
    }
    if (coupon.getUsageLimit() != null && usedCount(coupon) >= coupon.getUsageLimit()) {
      throw new BadRequestException("Coupon code usage limit has been reached");
    }
    return coupon;
  }

  private int usedCount(Coupon coupon) {
    return coupon.getUsedCount() == null ? 0 : coupon.getUsedCount();
  }

  private String dateRange(LocalDate startDate, LocalDate endDate) {
    return startDate.format(DISPLAY_DATE) + " and " + endDate.format(DISPLAY_DATE);
  }

  public void sendBookingBillEmail(Booking booking, PaymentStatus paymentStatus, String paymentMethod) {
    if (!isMailConfigured()) {
      log.warn("Skipping booking bill email for {} because MAIL_USERNAME or MAIL_PASSWORD is not configured", booking.getCustomer().getEmail());
      return;
    }

    try {
      var mimeMessage = mailSender.createMimeMessage();
      var helper = new MimeMessageHelper(mimeMessage, true, StandardCharsets.UTF_8.name());
      helper.setFrom(configuredMailUsername());
      helper.setTo(booking.getCustomer().getEmail());
      helper.setSubject("ClickKaar Bill - " + booking.getBookingNumber() + " - " + billStatus(paymentStatus));
      helper.setText(
          "Dear " + booking.getCustomer().getFullName() + ",\n\n"
              + "Thank you for booking with ClickKaar. Your checkout bill is below.\n\n"
              + "Bill Details:\n\n"
              + "- Booking Number: " + booking.getBookingNumber() + "\n"
              + "- Rental Period: " + dateRange(booking.getRentalStartDate(), booking.getRentalEndDate()) + "\n"
              + "- Rental Days: " + booking.getRentalDays() + "\n"
              + "- Items: " + bookedItems(booking) + "\n"
              + "- Total Amount: Rs. " + booking.getTotalAmount().toPlainString() + "\n"
              + "- Bill Status: " + billStatus(paymentStatus) + "\n"
              + "- Payment Method: " + paymentMethod + "\n"
              + "- Booking Status: " + booking.getStatus() + "\n\n"
              + nextPaymentStep(paymentStatus, paymentMethod) + "\n\n"
              + "The ClickKaar Terms & Conditions are attached with this email.\n\n"
              + "You can log in to your ClickKaar account to view your booking details.\n\n"
              + "Login URL: " + configuredLoginUrl() + "\n\n"
              + "If you have any questions or need assistance, please contact our support team.\n\n"
              + "Best Regards,\n"
              + "The ClickKaar Team\n"
              + "ClickKaar Support\n"
              + "Email: support@clickkaar.com\n"
              + "Website: https://clickkaar.com"
      );
      helper.addAttachment(
          "clickkaar-terms-and-conditions.txt",
          new ByteArrayResource(termsAndConditionsText().getBytes(StandardCharsets.UTF_8)),
          "text/plain; charset=UTF-8"
      );
      mailSender.send(mimeMessage);
      log.info("Booking bill email sent to {} for {}", booking.getCustomer().getEmail(), booking.getBookingNumber());
    } catch (MailAuthenticationException exception) {
      log.warn("Unable to send booking bill email to {} because SMTP authentication failed for {}", booking.getCustomer().getEmail(), configuredMailUsername());
    } catch (MailException exception) {
      log.warn("Unable to send booking bill email to {}", booking.getCustomer().getEmail(), exception);
    } catch (MessagingException exception) {
      log.warn("Unable to prepare booking bill email for {}", booking.getCustomer().getEmail(), exception);
    }
  }

  private String bookedItems(Booking booking) {
    return booking.getItems().stream()
        .map(item -> item.getProduct().getName())
        .collect(Collectors.joining(", "));
  }

  private boolean shouldSendBillOnCreate(String paymentMethod) {
    String normalized = normalizedPaymentMethod(paymentMethod);
    return normalized.isBlank() || normalized.equals("cash");
  }

  private String displayPaymentMethod(String paymentMethod) {
    String normalized = normalizedPaymentMethod(paymentMethod);
    if (normalized.equals("cash")) {
      return "Pay in cash at delivery";
    }
    if (normalized.equals("razorpay")) {
      return "Razorpay online payment";
    }
    return "Not selected";
  }

  private String normalizedPaymentMethod(String paymentMethod) {
    return paymentMethod == null ? "" : paymentMethod.trim().toLowerCase(Locale.ROOT);
  }

  private String billStatus(PaymentStatus paymentStatus) {
    return paymentStatus == PaymentStatus.PAID ? "PAID" : "UNPAID";
  }

  private String nextPaymentStep(PaymentStatus paymentStatus, String paymentMethod) {
    if (paymentStatus == PaymentStatus.PAID) {
      return "Payment received. Your booking is confirmed.";
    }

    return "Payment is pending. Please pay the bill amount using " + paymentMethod + ".";
  }

  private String termsAndConditionsText() {
    return staticContentRepository.findByPageKey("terms")
        .map(content -> content.getContent() == null ? "" : content.getContent().trim())
        .filter(content -> !content.isBlank() && !content.equalsIgnoreCase("Clickkaar rental terms placeholder."))
        .orElse(DEFAULT_TERMS_AND_CONDITIONS);
  }

  private boolean isMailConfigured() {
    return !configuredMailUsername().isBlank() && !configuredMailPassword().isBlank();
  }

  private String configuredMailUsername() {
    return mailUsername == null ? "" : mailUsername.trim();
  }

  private String configuredMailPassword() {
    return mailPassword == null ? "" : mailPassword.trim();
  }

  private String configuredLoginUrl() {
    return loginUrl == null || loginUrl.isBlank() ? "https://clickkaar.com/login" : loginUrl.trim();
  }

  private static final String DEFAULT_TERMS_AND_CONDITIONS = """
      CLICKKAAR TERMS & CONDITIONS

      1. These terms apply to every booking, rental, pickup, delivery, use, and return of ClickKaar rental equipment.
      2. The customer must provide accurate account, KYC, contact, billing, and delivery details before equipment is handed over.
      3. A booking is subject to equipment availability, verification, and ClickKaar confirmation.
      4. Rental charges, security deposits, delivery charges, taxes, late fees, damage charges, and any other applicable charges must be paid as communicated in the booking or bill.
      5. For pay-in-cash bookings, the bill remains unpaid until ClickKaar receives the cash payment and records the payment.
      6. Equipment must be used only for lawful purposes and handled carefully during the rental period.
      7. The customer must not sub-rent, lend, pledge, modify, repair, disassemble, or transfer the equipment without ClickKaar's written consent.
      8. The customer is responsible for loss, theft, missing accessories, and damage beyond normal wear and tear during the rental period.
      9. Equipment must be returned on or before the agreed return date and time. Late returns may attract additional charges.
      10. Security deposits may be adjusted against unpaid rental dues, late return charges, cleaning charges, repair charges, replacement charges, or other amounts owed.
      11. Cancellation, refund, rescheduling, and extension requests are subject to ClickKaar approval and applicable policy.
      12. ClickKaar may refuse, cancel, suspend, or recover equipment if customer details are false, payment is pending, risk is detected, or terms are breached.
      13. The customer agrees to indemnify ClickKaar against claims, losses, fines, or third-party damages caused by misuse of the equipment or breach of these terms.
      14. This agreement is governed by the laws of India.

      Contact:
      Email: info@clickkaar.com
      Phone: 91-9096820033
      Website: https://clickkaar.com
      """;
}
