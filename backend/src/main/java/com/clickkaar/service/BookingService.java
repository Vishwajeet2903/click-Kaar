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
import com.clickkaar.util.BusinessIdFormatter;
import jakarta.mail.MessagingException;
import jakarta.persistence.EntityNotFoundException;
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
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
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
  private final PdfDocumentService pdfDocumentService;
  private final InvoiceWorkbookService invoiceWorkbookService;
  private static final DateTimeFormatter DISPLAY_DATE = DateTimeFormatter.ofPattern("dd MMM yyyy");
  private static final SecureRandom OTP_RANDOM = new SecureRandom();

  @Value("${spring.mail.username:}")
  private String mailUsername;

  @Value("${spring.mail.password:}")
  private String mailPassword;

  @Value("${app.frontend.login-url:https://click-kaar.com/login}")
  private String loginUrl;

  @Transactional
  public BookingResponse create(BookingRequest request) {
    if (request.rentalEndDate().isBefore(request.rentalStartDate())) {
      throw new BadRequestException("Rental end date must be after start date");
    }
    int days = (int) ChronoUnit.DAYS.between(request.rentalStartDate(), request.rentalEndDate()) + 1;
    if (days > 7) {
      throw new BadRequestException("Rental duration can be maximum 7 days");
    }
    User customer = userRepository.findById(request.customerId()).orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
    String normalizedPaymentMethod = normalizedPaymentMethod(request.paymentMethod());
    if (normalizedPaymentMethod.equals("cash") && !isMailConfigured()) {
      throw new BadRequestException("Mail is not configured. Cash delivery OTP email cannot be sent.");
    }
    BookingStatus initialStatus = normalizedPaymentMethod.equals("razorpay")
        ? BookingStatus.PENDING
        : BookingStatus.CONFIRMED;
    Booking booking = Booking.builder()
        .bookingNumber(generateOrderNumber())
        .customer(customer)
        .rentalStartDate(request.rentalStartDate())
        .rentalEndDate(request.rentalEndDate())
        .rentalDays(days)
        .totalAmount(BigDecimal.ZERO)
        .deliveryOtp(normalizedPaymentMethod.equals("cash") ? generateDeliveryOtp() : null)
        .deliveryOtpVerified(false)
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
      BigDecimal lineTotal = discountedRentalTotal(product.getDailyPrice(), days);
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
        booking.getItems().stream().map(this::productName).toList()
    );
  }

  private String productName(BookingItem item) {
    try {
      return item.getProduct() == null ? "Unavailable product" : item.getProduct().getName();
    } catch (EntityNotFoundException exception) {
      return "Unavailable product";
    }
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

  private BigDecimal discountedRentalTotal(BigDecimal dailyPrice, int days) {
    BigDecimal baseTotal = dailyPrice.multiply(BigDecimal.valueOf(days));
    int discountPercent = rentalDiscountPercent(days);
    if (discountPercent == 0) {
      return baseTotal;
    }
    return baseTotal
        .multiply(BigDecimal.valueOf(100 - discountPercent))
        .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
  }

  private int rentalDiscountPercent(int days) {
    if (days >= 7) return 20;
    if (days >= 5) return 15;
    if (days >= 2) return 5;
    return 0;
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
              + "- Booking Status: " + booking.getStatus() + "\n"
              + deliveryOtpLine(booking) + "\n"
              + nextPaymentStep(paymentStatus, paymentMethod) + "\n\n"
              + "Your invoice workbook and the ClickKaar Terms & Conditions PDF are attached with this email.\n\n"
              + "You can log in to your ClickKaar account to view your booking details.\n\n"
              + "Login URL: " + configuredLoginUrl() + "\n\n"
              + "If you have any questions or need assistance, please contact our support team.\n\n"
              + "Best Regards,\n"
              + "The ClickKaar Team\n"
              + "ClickKaar Support\n"
              + "Email: clickkaar@gmail.com\n"
              + "Website: https://click-kaar.com/"
      );
      helper.addAttachment(
          BusinessIdFormatter.invoiceNumber(booking) + ".xlsx",
          new ByteArrayResource(invoiceWorkbookService.invoiceWorkbook(booking)),
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      helper.addAttachment(
          "clickkaar-terms-and-conditions.pdf",
          new ByteArrayResource(pdfDocumentService.termsPdf(termsAndConditionsText())),
          "application/pdf"
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


  private String generateOrderNumber() {
    LocalDateTime now = LocalDateTime.now();
    String prefix = "ORD-" + now.format(DateTimeFormatter.ofPattern("yyMMdd")) + "-";
    long sequence = bookingRepository.countByBookingNumberStartingWith(prefix) + 1;
    String bookingNumber = BusinessIdFormatter.orderNumber(now, sequence);
    while (bookingRepository.existsByBookingNumber(bookingNumber)) {
      sequence += 1;
      bookingNumber = BusinessIdFormatter.orderNumber(now, sequence);
    }
    return bookingNumber;
  }

  private String generateDeliveryOtp() {
    return String.valueOf(100000 + OTP_RANDOM.nextInt(900000));
  }

  private String deliveryOtpLine(Booking booking) {
    if (booking.getDeliveryOtp() == null || booking.getDeliveryOtp().isBlank()) {
      return "";
    }
    return "- Delivery OTP: " + booking.getDeliveryOtp() + "\n\n"
        + "This OTP is mandatory at the time of delivery. Share it only with the Click-Kaar delivery/admin team after checking your order.";
  }

  private String bookedItems(Booking booking) {
    return booking.getItems().stream()
        .map(this::productName)
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
    return loginUrl == null || loginUrl.isBlank() ? "https://click-kaar.com/login" : loginUrl.trim();
  }

  private static final String DEFAULT_TERMS_AND_CONDITIONS = """
      CLICKKAAR TERMS & CONDITIONS

      1. Introduction
      These Terms & Conditions ("Terms") govern every booking, rental and use of Click-Kaar's website, mobile application and equipment rental services (together, the "Platform"). Click-Kaar rents professional photography, videography, cinema, lighting, audio, drone, action-camera and related production equipment ("Equipment") to individuals, freelancers, content creators, production houses and businesses across India.
      By booking Equipment or using the Platform, you agree to these Terms, our Privacy Policy, and the linked policies referenced throughout this document (together, the "Agreement").

      2. Definitions
      "You" / "Customer" means the person or entity that books Equipment through the Platform.
      "Order" means the specific rental booking confirmed by Click-Kaar, including the Rental Order document.
      "Rental Period" means the period from the confirmed pickup/delivery time until the Equipment is returned to and accepted by Click-Kaar.
      "Security Deposit" means the refundable amount held against loss, damage or breach of this Agreement.
      "MRP" means the current replacement value of an item of Equipment as listed by Click-Kaar.

      3. Acceptance of Terms
      You accept these Terms electronically when you (a) tick the acceptance checkbox at checkout, (b) complete payment for an Order, or (c) sign the Rental Order at pickup/delivery, whichever happens first. This constitutes a valid electronic contract under the Information Technology Act, 2000, and no physical signature is required.

      4. Eligibility
      You must be at least 18 years old and capable of entering into a binding contract under the Indian Contract Act, 1872.
      You must provide accurate KYC information as described in our Customer KYC Declaration.
      Business and production-house accounts must provide details of an authorised signatory, where applicable.
      Click-Kaar may verify your identity, address and payment details before confirming any Order.

      5. Customer Accounts
      You are responsible for maintaining the confidentiality of your login credentials and for all activity on your account. Notify us immediately at the contact details in Section 31 if you suspect unauthorised use of your account.

      6. Booking Process
      Select Equipment, rental dates and pickup/delivery mode on the Platform.
      Complete KYC verification and pay the applicable rental amount and Security Deposit.
      You will receive a Rental Order confirming the booking. An Order is confirmed only once Click-Kaar issues this confirmation; availability shown on the Platform is not a guarantee until confirmed.

      7. Rental Orders
      Each Order sets out the Equipment, accessories, Rental Period, pricing, deposit and pickup/return details. The Rental Order forms part of this Agreement. In case of conflict between the Rental Order and these Terms, the Rental Order prevails only for the specific commercial details it covers (dates, pricing, deposit amount).

      8. Pricing
      Rental pricing is shown on the Platform per day/period and may vary with demand, duration and Equipment type.
      All prices displayed on the Platform are the final prices payable unless expressly stated otherwise at the time of booking.
      Click-Kaar may revise listed prices at any time; the price confirmed at the time of your Order will not change for that Order.

      9. Payments
      Payments may be made through the payment methods offered on the Platform (cards, UPI, net banking, wallets, or such other modes as made available).
      Full rental payment (or the applicable advance) and the Security Deposit must be cleared before Equipment is handed over.
      Customers must provide accurate billing information at the time of booking. Invoices, once issued, may only be corrected for genuine clerical or billing errors.

      10. Security Deposit
      A refundable Security Deposit is collected for every Order, calculated based on the MRP and risk profile of the Equipment booked.
      The deposit is not rental fee and does not reduce the rental charges payable.
      The deposit is refunded to the original payment method within the timeline in our Damage, Repair & Replacement Policy, after adjustment (if any) for damage, loss, late return charges or other amounts owed under this Agreement.

      11. Equipment Collection
      You (or an authorised representative carrying valid ID) must collect Equipment at the agreed time and location. Click-Kaar may require the person collecting Equipment to match the KYC on file. A joint Equipment Handover Checklist is completed and signed (physically or electronically) at the time of collection, along with photographic/video evidence of the Equipment's condition.

      12. Delivery
      Where delivery is opted for, Click-Kaar will deliver Equipment to the address confirmed in the Order. Delivery timelines are estimates and may vary due to traffic, weather or logistics constraints beyond our control. You must inspect the Equipment on delivery and flag any visible issue immediately - see Section 15 (Inspection Process).

      13. Customer Responsibilities
      During the Rental Period, you agree to:
      Use the Equipment only for lawful purposes and in line with its intended use and any operating instructions provided.
      Keep the Equipment safe, clean and protected from weather, moisture, dust, theft and unauthorised use.
      Transport the Equipment securely using appropriate cases/bags, and not expose it to conditions likely to cause damage.
      Not use the Equipment for any illegal activity, including any activity restricted under drone/aviation regulations, obscenity, surveillance without consent, or other unlawful filming.
      Not attempt to repair, service, disassemble or modify the Equipment yourself or through a third party.
      Not sub-rent, lend, pledge or transfer the Equipment to any other person without Click-Kaar's prior written consent.
      Return the Equipment complete with all accessories, cables, batteries, cases and packaging originally provided.

      14. Equipment Condition
      Equipment is rented "as inspected and accepted" at handover. Click-Kaar equipment is professionally serviced and quality-checked before each rental, and any pre-existing marks or issues are recorded on the Equipment Handover Checklist at the time of collection/delivery.

      15. Inspection Process
      At handover: Equipment is jointly inspected, tested for basic functionality, and photographed/filmed. Both parties sign the Equipment Handover Checklist.
      At return: Equipment is jointly inspected against the same checklist, using the Equipment Return Checklist, with fresh photographic/video evidence.
      Any damage, missing accessory or malfunction identified at return that was not recorded at handover is treated as having occurred during the Rental Period, unless you can show otherwise.

      16. Damage
      You are responsible for damage caused during the Rental Period beyond normal wear and tear, whether caused by you, your representative, or anyone you allowed to access the Equipment. The full process for assessing and charging for damage is set out in our Damage, Repair & Replacement Policy, which forms part of this Agreement.

      17. Loss
      If Equipment is lost during the Rental Period (including being left behind, misplaced, or otherwise not returned), you are liable for its full MRP-based replacement value, less any amount already covered by the Security Deposit, as detailed in the Damage, Repair & Replacement Policy.

      18. Theft
      Report any theft to the nearest police station and obtain a First Information Report (FIR) or acknowledged complaint copy within 48 hours of discovering the theft.
      Share the FIR/complaint copy with Click-Kaar within 3 working days.
      Where a valid police complaint is furnished in time, Click-Kaar will assess the claim fairly; where no complaint is furnished, the theft will be treated as a loss under Section 17 and charged accordingly.

      19. Security Deposit Adjustment
      Click-Kaar may adjust the Security Deposit against: outstanding rental dues, late return charges, cleaning charges for Equipment returned unreasonably soiled, repair/replacement costs for damage or loss, and any other amount properly owed under this Agreement. You will be shown an itemised statement before any adjustment, consistent with our Damage, Repair & Replacement Policy.

      20. Rental Extensions
      Extension requests should be made through the Platform or customer support before the scheduled return time, and are subject to Equipment availability. Approved extensions are charged at the applicable daily rate for the extended period, payable before the extension begins.

      21. Late Returns
      Equipment not returned by the agreed return time, without a pre-approved extension, will attract late fees as displayed on the Platform/Rental Order, calculated per hour/day of delay. Click-Kaar may treat prolonged, uncommunicated non-return as a loss under Section 17 and take recovery action, including engaging authorities where appropriate.

      22. Cancellation
      Cancellation, rescheduling and refund timelines for both customer-initiated and Click-Kaar-initiated cancellations are set out in our Cancellation, Refund & Extension Policy, which forms part of this Agreement.

      23. Intellectual Property
      The Platform, its content, branding, software and design are owned by Click-Kaar and protected under applicable intellectual property laws. You may not copy, reproduce or use Click-Kaar's branding or Platform content without prior written permission. Nothing in this Agreement grants you rights over Click-Kaar's intellectual property beyond using the Platform to book rentals.

      24. Privacy
      Our collection and use of your personal data is governed by our Privacy Policy, which forms part of this Agreement.

      25. Suspension & Termination
      Click-Kaar may suspend or terminate your account, or refuse/cancel a booking, where we reasonably believe you have provided false information, breached this Agreement, engaged in fraud, or misused the Equipment or Platform.
      Click-Kaar may recover Equipment immediately, including through a representative, if it reasonably believes the Equipment is at risk of damage, loss or misuse, or if payment obligations are not met.
      Termination does not affect amounts already due or liabilities already accrued under this Agreement.

      26. Limitation of Liability
      Click-Kaar is not liable for indirect, incidental or consequential losses (such as loss of business, shoot cancellation costs, or loss of content/footage) arising from Equipment malfunction, delay or unavailability, except where caused by Click-Kaar's gross negligence or wilful default. Click-Kaar's total liability to you under this Agreement is limited to the rental amount paid for the relevant Order, save where Indian law does not permit such a limitation.

      27. Indemnity
      You agree to indemnify Click-Kaar against claims, losses, fines or third-party damages arising from your breach of this Agreement, misuse of the Equipment, violation of applicable law (including drone/aviation, privacy or content laws), or use of the Equipment in a manner that causes harm to any person or property.

      28. Governing Law
      This Agreement is governed by the laws of India. Subject to Section 29, the courts at Pune, India shall have exclusive jurisdiction.

      29. Dispute Resolution
      In case of any dispute, you agree to first raise the issue with Click-Kaar customer support for good-faith resolution within 15 days.
      If unresolved, the parties may attempt to resolve the dispute amicably or pursue remedies available under applicable law.
      This clause does not affect your rights to approach the consumer fora under the Consumer Protection Act, 2019.

      30. General Provisions
      Force Majeure: Click-Kaar is not liable for delays or failures caused by events beyond its reasonable control, including natural disasters, strikes, government action, internet/network outages or civil unrest.
      Electronic Acceptance: Actions such as digital ticks, OTP confirmation, e-signatures or continued use of the Platform constitute valid acceptance of this Agreement and any updates to it.
      Website Updates: Click-Kaar may update these Terms from time to time; the version in force at the time of your Order applies to that Order, and continued use after an update constitutes acceptance of the revised Terms.
      Severability: If any clause is found invalid or unenforceable, the remaining clauses continue in full force.
      Assignment: You may not assign your rights under this Agreement without Click-Kaar's written consent. Click-Kaar may assign this Agreement in connection with a merger, acquisition or business transfer.
      Entire Agreement: This Agreement, together with the linked policies and your Rental Order, constitutes the entire agreement between you and Click-Kaar for each Order.

      31. Contact Details
      For questions, support or notices relating to this Agreement, contact us at:
      Email: clickkaar@gmail.com
      Phone: 91-9096820033
      Registered Office: Bld Road, Hatwane Complex, C/O Patil Steel, Malkapur, Malkapur, Buldhana, 443101

      """;
}


