package com.clickkaar.service;

import com.clickkaar.dto.booking.BookingRequest;
import com.clickkaar.dto.booking.BookingResponse;
import com.clickkaar.dto.booking.AvailabilityResponse;
import com.clickkaar.dto.booking.BlockedDateRangeResponse;
import com.clickkaar.entity.Booking;
import com.clickkaar.entity.BookingItem;
import com.clickkaar.entity.Product;
import com.clickkaar.entity.User;
import com.clickkaar.enums.BookingStatus;
import com.clickkaar.enums.PaymentStatus;
import com.clickkaar.exception.BadRequestException;
import com.clickkaar.exception.ResourceNotFoundException;
import com.clickkaar.repository.BookingRepository;
import com.clickkaar.repository.ProductRepository;
import com.clickkaar.repository.StaticContentRepository;
import com.clickkaar.repository.UserRepository;
import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
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
    Booking booking = Booking.builder()
        .bookingNumber("CK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
        .customer(customer)
        .rentalStartDate(request.rentalStartDate())
        .rentalEndDate(request.rentalEndDate())
        .rentalDays(days)
        .totalAmount(BigDecimal.ZERO)
        .status(BookingStatus.PENDING)
        .build();

    BigDecimal total = BigDecimal.ZERO;
    for (var item : request.items()) {
      Product product = productRepository.findById(item.productId()).orElseThrow(() -> new ResourceNotFoundException("Product not found"));
      if (bookingRepository.existsOverlappingBooking(item.productId(), request.rentalStartDate(), request.rentalEndDate())) {
        throw new BadRequestException(unavailableMessage(product.getName(), request.rentalStartDate(), request.rentalEndDate()));
      }
      BigDecimal lineTotal = product.getDailyPrice().multiply(BigDecimal.valueOf(days));
      booking.getItems().add(BookingItem.builder()
          .booking(booking)
          .product(product)
          .dailyPrice(product.getDailyPrice())
          .lineTotal(lineTotal)
          .build());
      total = total.add(lineTotal);
    }
    booking.setTotalAmount(total);
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
    boolean booked = bookingRepository.existsOverlappingBooking(productId, startDate, endDate);
    if (booked) {
      return new AvailabilityResponse(false, unavailableMessage(product.getName(), startDate, endDate));
    }

    return new AvailabilityResponse(true, product.getName() + " is available for " + dateRange(startDate, endDate) + ".");
  }

  @Transactional(readOnly = true)
  public List<BlockedDateRangeResponse> blockedRanges(Long productId) {
    if (!productRepository.existsById(productId)) {
      throw new ResourceNotFoundException("Product not found");
    }

    return bookingRepository.findBlockedRangesForProduct(productId, LocalDate.now()).stream()
        .map(booking -> new BlockedDateRangeResponse(booking.getRentalStartDate(), booking.getRentalEndDate()))
        .toList();
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
