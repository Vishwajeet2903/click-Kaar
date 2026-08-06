package com.clickkaar.controller;

import com.clickkaar.dto.payment.RefundRequest;
import com.clickkaar.dto.admin.EmployeeRequest;
import com.clickkaar.dto.admin.EmployeeResponse;
import com.clickkaar.dto.admin.CustomerVerificationResponse;
import com.clickkaar.dto.admin.RegistrationDocumentResponse;
import com.clickkaar.dto.content.CustomerReviewResponse;
import com.clickkaar.dto.content.GalleryImageRequest;
import com.clickkaar.dto.content.GalleryImageResponse;
import com.clickkaar.dto.product.ProductRequest;
import com.clickkaar.dto.product.ProductResponse;
import com.clickkaar.entity.Booking;
import com.clickkaar.entity.BookingItem;
import com.clickkaar.entity.BookingNote;
import com.clickkaar.entity.Coupon;
import com.clickkaar.entity.PendingRegistration;
import com.clickkaar.entity.Payment;
import com.clickkaar.entity.PaymentRemarkLog;
import com.clickkaar.entity.Product;
import com.clickkaar.entity.Refund;
import com.clickkaar.entity.Role;
import com.clickkaar.entity.StaticContent;
import com.clickkaar.entity.User;
import com.clickkaar.enums.AvailabilityStatus;
import com.clickkaar.enums.BlogStatus;
import com.clickkaar.enums.BookingStatus;
import com.clickkaar.enums.PaymentStatus;
import com.clickkaar.enums.RefundStatus;
import com.clickkaar.enums.RoleName;
import com.clickkaar.exception.BadRequestException;
import com.clickkaar.exception.ResourceNotFoundException;
import com.clickkaar.repository.BookingNoteRepository;
import com.clickkaar.repository.BlogPostRepository;
import com.clickkaar.repository.BookingRepository;
import com.clickkaar.repository.PendingRegistrationRepository;
import com.clickkaar.repository.CouponRepository;
import com.clickkaar.repository.PaymentRepository;
import com.clickkaar.repository.PaymentRemarkLogRepository;
import com.clickkaar.repository.ProductRepository;
import com.clickkaar.repository.RefundRepository;
import com.clickkaar.repository.RoleRepository;
import com.clickkaar.repository.StaticContentRepository;
import com.clickkaar.repository.UserRepository;
import com.clickkaar.repository.WishlistRepository;
import com.clickkaar.service.ProductService;
import com.clickkaar.service.ContentService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.net.MalformedURLException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAnyRole('ADMIN','MANAGER','INVENTORY_STAFF','CONTENT_EDITOR')")
@RequiredArgsConstructor
@Slf4j
public class AdminController {
  private final BookingRepository bookingRepository;
  private final ProductRepository productRepository;
  private final PaymentRepository paymentRepository;
  private final CouponRepository couponRepository;
  private final PaymentRemarkLogRepository paymentRemarkLogRepository;
  private final UserRepository userRepository;
  private final PendingRegistrationRepository pendingRegistrationRepository;
  private final RoleRepository roleRepository;
  private final BookingNoteRepository bookingNoteRepository;
  private final WishlistRepository wishlistRepository;
  private final RefundRepository refundRepository;
  private final BlogPostRepository blogPostRepository;
  private final StaticContentRepository staticContentRepository;
  private final PasswordEncoder passwordEncoder;
  private final ProductService productService;
  private final ContentService contentService;
  private final ObjectMapper objectMapper;
  private final JavaMailSender mailSender;

  @Value("${spring.mail.username:}")
  private String mailUsername;

  @Value("${spring.mail.password:}")
  private String mailPassword;

  @Value("${app.frontend.login-url:https://clickkaar.com/login}")
  private String loginUrl;

  @GetMapping("/dashboard")
  public Map<String, Object> dashboard() {
    YearMonth month = YearMonth.now();
    return Map.of(
        "month", month.toString(),
        "totalBookingsThisMonth", bookingRepository.count(),
        "revenueThisMonth", paymentRepository.findAll().stream()
            .map(payment -> payment.getAmount() == null ? BigDecimal.ZERO : payment.getAmount())
            .reduce(BigDecimal.ZERO, BigDecimal::add),
        "itemsInCatalogue", productRepository.count(),
        "overdueReturns", 0
    );
  }

  @GetMapping("/inventory")
  public List<ProductResponse> inventory() {
    return productService.findAll();
  }

  @PostMapping("/inventory")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','INVENTORY_STAFF')")
  @ResponseStatus(HttpStatus.CREATED)
  public ProductResponse createInventoryProduct(@Valid @RequestBody ProductRequest request) {
    return productService.create(request);
  }

  @PostMapping(value = "/inventory/save", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','INVENTORY_STAFF')")
  @ResponseStatus(HttpStatus.CREATED)
  public ProductResponse createInventoryProductWithImage(
      @RequestPart("product") String productJson,
      @RequestPart("image") MultipartFile image
  ) {
    return productService.create(productRequestWithImage(productJson, image));
  }

  @PutMapping("/inventory/{productId}")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','INVENTORY_STAFF')")
  public ProductResponse updateInventoryProduct(@PathVariable Long productId, @Valid @RequestBody ProductRequest request) {
    return productService.update(productId, request);
  }

  @PutMapping(value = "/inventory/{productId}/save", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','INVENTORY_STAFF')")
  public ProductResponse updateInventoryProductWithImage(
      @PathVariable Long productId,
      @RequestPart("product") String productJson,
      @RequestPart(value = "image", required = false) MultipartFile image
  ) {
    return productService.update(productId, productRequestWithImage(productJson, image));
  }

  @GetMapping("/reviews")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CONTENT_EDITOR')")
  public List<CustomerReviewResponse> reviews() {
    return contentService.reviews();
  }

  @DeleteMapping("/reviews/{reviewId}")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CONTENT_EDITOR')")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteReview(@PathVariable Long reviewId) {
    contentService.deleteReview(reviewId);
  }

  @PatchMapping("/reviews/{reviewId}/reply")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CONTENT_EDITOR')")
  public CustomerReviewResponse replyToReview(@PathVariable Long reviewId, @RequestBody ReviewReplyRequest request) {
    return contentService.replyToReview(reviewId, request.reply());
  }

  @GetMapping("/gallery")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CONTENT_EDITOR')")
  public List<GalleryImageResponse> galleryImages() {
    return contentService.allGalleryImages();
  }

  @PostMapping("/gallery")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CONTENT_EDITOR')")
  @ResponseStatus(HttpStatus.CREATED)
  public GalleryImageResponse createGalleryImage(@Valid @RequestBody GalleryImageRequest request) {
    return contentService.createGalleryImage(request);
  }

  @PostMapping(value = "/gallery/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CONTENT_EDITOR')")
  @ResponseStatus(HttpStatus.CREATED)
  public GalleryImageResponse uploadGalleryImage(
      @RequestParam("image") MultipartFile image,
      @RequestParam String altText,
      @RequestParam(defaultValue = "false") boolean wide,
      @RequestParam(defaultValue = "false") boolean tall,
      @RequestParam Integer displayOrder,
      @RequestParam(defaultValue = "true") Boolean active
  ) {
    return contentService.uploadGalleryImage(image, altText, wide, tall, displayOrder, active);
  }

  @PostMapping(value = "/images/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','INVENTORY_STAFF','CONTENT_EDITOR')")
  @ResponseStatus(HttpStatus.CREATED)
  public ImageUploadResponse uploadImage(@RequestParam("image") MultipartFile image) {
    return new ImageUploadResponse(contentService.uploadImage(image));
  }

  @DeleteMapping("/gallery/{imageId}")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CONTENT_EDITOR')")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteGalleryImage(@PathVariable Long imageId) {
    contentService.deleteGalleryImage(imageId);
  }

  @PatchMapping("/inventory/{productId}/maintenance")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','INVENTORY_STAFF')")
  @Transactional
  public ProductResponse markProductMaintenance(@PathVariable Long productId) {
    Product product = productRepository.findById(productId)
        .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
    product.setAvailabilityStatus(AvailabilityStatus.MAINTENANCE);
    return productService.findById(productId);
  }

  @PatchMapping("/inventory/{productId}/available")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','INVENTORY_STAFF')")
  @Transactional
  public ProductResponse markProductAvailable(@PathVariable Long productId) {
    Product product = productRepository.findById(productId)
        .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
    product.setAvailabilityStatus(AvailabilityStatus.AVAILABLE);
    return productService.findById(productId);
  }

  @GetMapping("/bookings")
  @Transactional(readOnly = true)
  public List<AdminBookingResponse> bookings() {
    return bookingRepository.findAll().stream().map(this::adminBookingResponse).toList();
  }

  @PatchMapping("/bookings/{bookingId}/status")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','INVENTORY_STAFF')")
  @Transactional
  public AdminBookingResponse updateBookingStatus(@PathVariable Long bookingId, @RequestBody BookingStatusRequest request) {
    Booking booking = bookingRepository.findById(bookingId)
        .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
    booking.setStatus(request.status());
    return adminBookingResponse(booking);
  }

  @PostMapping("/bookings/{bookingId}/notes")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @Transactional
  public AdminBookingResponse addBookingNote(@PathVariable Long bookingId, @RequestBody BookingNoteRequest request) {
    Booking booking = bookingRepository.findById(bookingId)
        .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
    bookingNoteRepository.save(BookingNote.builder()
        .booking(booking)
        .admin(currentAdmin())
        .note(request.note())
        .build());
    return adminBookingResponse(booking);
  }


  @PostMapping("/bookings/{bookingId}/delivery-otp/verify")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @Transactional
  public AdminBookingResponse verifyDeliveryOtp(@PathVariable Long bookingId, @RequestBody DeliveryOtpRequest request) {
    Booking booking = bookingRepository.findById(bookingId)
        .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
    String expectedOtp = booking.getDeliveryOtp() == null ? "" : booking.getDeliveryOtp().trim();
    String submittedOtp = request.otp() == null ? "" : request.otp().trim();
    if (expectedOtp.isBlank()) {
      throw new BadRequestException("Delivery OTP is not available for this booking");
    }
    if (booking.isDeliveryOtpVerified()) {
      return adminBookingResponse(booking);
    }
    if (!expectedOtp.equals(submittedOtp)) {
      throw new BadRequestException("Invalid delivery OTP");
    }
    booking.setDeliveryOtpVerified(true);
    if (booking.getStatus() == BookingStatus.CONFIRMED) {
      booking.setStatus(BookingStatus.ACTIVE);
    }
    return adminBookingResponse(booking);
  }

  @GetMapping("/customers")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','INVENTORY_STAFF')")
  public List<AdminCustomerResponse> customers() {
    return userRepository.findAll().stream()
        .filter(user -> user.getRoles().stream().anyMatch(role -> role.getName() == RoleName.CUSTOMER))
        .map(this::adminCustomerResponse)
        .toList();
  }

  @GetMapping("/customers/{customerId}/details")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  public AdminCustomerDetailResponse customerDetails(@PathVariable Long customerId) {
    User customer = userRepository.findById(customerId)
        .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
    if (customer.getRoles().stream().noneMatch(role -> role.getName() == RoleName.CUSTOMER)) {
      throw new ResourceNotFoundException("Customer not found");
    }
    return adminCustomerDetailResponse(customer);
  }

  @GetMapping("/customers/verified/{customerId}/documents/{documentType}")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  public ResponseEntity<Resource> verifiedCustomerDocument(@PathVariable Long customerId, @PathVariable String documentType) {
    User customer = userRepository.findById(customerId)
        .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
    if (customer.getRoles().stream().noneMatch(role -> role.getName() == RoleName.CUSTOMER)) {
      throw new ResourceNotFoundException("Customer not found");
    }
    String documentName = documentNameForType(customer, documentType);
    return registrationDocumentResponse(documentName);
  }

  @PatchMapping("/customers/{customerId}/blocked")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @Transactional
  public AdminCustomerResponse setCustomerBlocked(@PathVariable Long customerId, @RequestBody CustomerBlockRequest request) {
    User customer = userRepository.findById(customerId)
        .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
    customer.setEnabled(!request.blocked());
    return adminCustomerResponse(customer);
  }

  @GetMapping("/payments")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  public List<AdminPaymentResponse> payments() {
    return paymentRepository.findAll().stream().map(this::adminPaymentResponse).toList();
  }

  @PatchMapping("/payments/{paymentId}/remark")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @Transactional
  public AdminPaymentResponse updatePaymentRemark(@PathVariable Long paymentId, @RequestBody PaymentRemarkRequest request) {
    Payment payment = paymentRepository.findById(paymentId)
        .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
    String oldRemark = payment.getRemark() == null ? "" : payment.getRemark().trim();
    String newRemark = request.remark() == null ? "" : request.remark().trim();
    if (!Objects.equals(oldRemark, newRemark)) {
      paymentRemarkLogRepository.save(PaymentRemarkLog.builder()
          .payment(payment)
          .oldRemark(oldRemark)
          .newRemark(newRemark)
          .changedBy(currentAdmin().getEmail())
          .build());
      payment.setRemark(newRemark);
    }
    return adminPaymentResponse(payment);
  }

  @GetMapping("/payments/{paymentId}/remark/logs")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  public List<PaymentRemarkLogResponse> paymentRemarkLogs(@PathVariable Long paymentId) {
    if (!paymentRepository.existsById(paymentId)) {
      throw new ResourceNotFoundException("Payment not found");
    }
    return paymentRemarkLogRepository.findByPaymentIdOrderByCreatedAtDesc(paymentId).stream()
        .map(log -> new PaymentRemarkLogResponse(
            log.getId(),
            log.getOldRemark(),
            log.getNewRemark(),
            log.getChangedBy(),
            log.getCreatedAt()
        ))
        .toList();
  }

  @PostMapping("/payments/{paymentId}/refunds")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @Transactional
  public AdminPaymentResponse refundPayment(@PathVariable Long paymentId, @RequestBody AdminRefundRequest request) {
    Payment payment = paymentRepository.findById(paymentId)
        .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
    refundRepository.save(Refund.builder()
        .payment(payment)
        .amount(request.amount() == null ? payment.getAmount() : request.amount())
        .reason(request.reason())
        .status(RefundStatus.REQUESTED)
        .build());
    payment.setStatus(PaymentStatus.REFUNDED);
    return adminPaymentResponse(payment);
  }

  @GetMapping("/content")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CONTENT_EDITOR')")
  public AdminContentResponse content() {
    List<AdminBlogPostResponse> posts = blogPostRepository.findAll().stream()
        .map(post -> new AdminBlogPostResponse(
            post.getId(),
            post.getTitle(),
            post.getSlug(),
            post.getCoverImage(),
            post.getCategory(),
            post.getAuthorName(),
            post.getStatus(),
            post.getPublishDate(),
            post.getTags(),
            post.getSeoTitle(),
            post.getSeoDescription(),
            post.getSeoKeywords(),
            post.getContent()
        ))
        .toList();
    List<AdminStaticContentResponse> staticPages = staticContentRepository.findAll().stream()
        .map(content -> new AdminStaticContentResponse(
            content.getPageKey(),
            content.getPageKey(),
            content.getUpdatedAt(),
            content.getContent() == null || content.getContent().isBlank() ? "NEEDS_REVIEW" : "CURRENT"
        ))
        .toList();
    return new AdminContentResponse(posts, staticPages);
  }

  @GetMapping("/reports/categories")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  public List<CategoryReportResponse> categoryReports() {
    return productRepository.findAll().stream()
        .collect(Collectors.groupingBy(product -> product.getCategory().getDisplayName(), Collectors.counting()))
        .entrySet().stream()
        .map(entry -> new CategoryReportResponse(entry.getKey(), entry.getValue()))
        .toList();
  }

  @GetMapping("/roles/permissions")
  @PreAuthorize("hasRole('ADMIN')")
  public List<RolePermissionResponse> rolePermissions() {
    return List.of(
        new RolePermissionResponse("Dashboard", "View", "View", "View", "View"),
        new RolePermissionResponse("Inventory", "CRUD", "CRUD", "CRUD", "View"),
        new RolePermissionResponse("Bookings", "CRUD + cancel", "CRUD", "Update returns", "View"),
        new RolePermissionResponse("Payments & refunds", "Refund + export", "View + export", "No access", "No access"),
        new RolePermissionResponse("Customers", "Block + edit", "View + edit", "View", "No access"),
        new RolePermissionResponse("Content", "CRUD", "Approve", "No access", "CRUD drafts"),
        new RolePermissionResponse("Settings & roles", "CRUD", "No access", "No access", "No access")
    );
  }

  @GetMapping("/settings")
  @PreAuthorize("hasRole('ADMIN')")
  public AdminSettingsRequest settings() {
    return staticContentRepository.findByPageKey("admin-settings")
        .map(content -> {
          try {
            return objectMapper.readValue(content.getContent(), AdminSettingsRequest.class);
          } catch (JsonProcessingException exception) {
            throw new BadRequestException("Admin settings are not valid JSON");
          }
        })
        .orElseGet(() -> new AdminSettingsRequest("Razorpay", "Security deposit", 30, 18, "", "", "", ""));
  }

  @PutMapping("/settings")
  @PreAuthorize("hasRole('ADMIN')")
  @Transactional
  public AdminSettingsRequest saveSettings(@RequestBody AdminSettingsRequest request) {
    try {
      StaticContent content = staticContentRepository.findByPageKey("admin-settings").orElseGet(StaticContent::new);
      content.setPageKey("admin-settings");
      content.setContent(objectMapper.writeValueAsString(request));
      staticContentRepository.save(content);
      return request;
    } catch (JsonProcessingException exception) {
      throw new BadRequestException("Unable to save admin settings");
    }
  }

  @GetMapping("/coupons")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  public List<AdminCouponResponse> coupons() {
    return couponRepository.findAll().stream()
        .map(this::adminCouponResponse)
        .toList();
  }

  @PostMapping("/coupons")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @ResponseStatus(HttpStatus.CREATED)
  @Transactional
  public AdminCouponResponse createCoupon(@RequestBody AdminCouponRequest request) {
    String code = normalizeCouponCode(request.code());
    BigDecimal discountPercent = request.discountPercent();
    if (code.isBlank()) {
      throw new BadRequestException("Enter a coupon code");
    }
    if (discountPercent == null || discountPercent.compareTo(BigDecimal.ONE) < 0 || discountPercent.compareTo(BigDecimal.valueOf(100)) > 0) {
      throw new BadRequestException("Discount percent must be between 1 and 100");
    }
    if (request.usageLimit() != null && request.usageLimit() < 1) {
      throw new BadRequestException("Usage limit must be at least 1");
    }
    if (couponRepository.existsByCodeIgnoreCase(code)) {
      throw new BadRequestException("Coupon code already exists");
    }

    Coupon coupon = Coupon.builder()
        .code(code)
        .discountPercent(discountPercent)
        .active(request.active() == null || request.active())
        .usageLimit(request.usageLimit())
        .validUntil(request.validUntil())
        .build();
    return adminCouponResponse(couponRepository.save(coupon));
  }

  @DeleteMapping("/coupons/{couponId}")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @Transactional
  public void deleteCoupon(@PathVariable Long couponId) {
    if (!couponRepository.existsById(couponId)) {
      throw new ResourceNotFoundException("Coupon not found");
    }
    couponRepository.deleteById(couponId);
  }

  @PatchMapping("/coupons/{couponId}/active")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @Transactional
  public AdminCouponResponse setCouponActive(@PathVariable Long couponId, @RequestBody CouponActiveRequest request) {
    Coupon coupon = couponRepository.findById(couponId)
        .orElseThrow(() -> new ResourceNotFoundException("Coupon not found"));
    coupon.setActive(request.active());
    return adminCouponResponse(coupon);
  }

  @PostMapping("/employees")
  @PreAuthorize("hasRole('ADMIN')")
  @ResponseStatus(HttpStatus.CREATED)
  public EmployeeResponse createEmployee(@Valid @RequestBody EmployeeRequest request) {
    if (userRepository.existsByEmail(request.email())) {
      throw new BadRequestException("Email is already registered");
    }
    if (userRepository.existsByMobile(request.mobile())) {
      throw new BadRequestException("Mobile is already registered");
    }

    RoleName requestedRole = employeeRoleName(request.role());
    Role employeeRole = roleRepository.findByName(requestedRole)
        .orElseThrow(() -> new BadRequestException(requestedRole.name() + " role is not configured"));

    User employee = User.builder()
        .fullName(request.fullName())
        .email(request.email().toLowerCase())
        .mobile(request.mobile())
        .password(passwordEncoder.encode(request.password()))
        .enabled(true)
        .mobileVerified(false)
        .roles(Set.of(employeeRole))
        .build();

    User saved = userRepository.save(employee);
    Set<String> roles = saved.getRoles().stream().map(role -> role.getName().name()).collect(Collectors.toSet());
    return new EmployeeResponse(saved.getId(), saved.getFullName(), saved.getEmail(), saved.getMobile(), roles);
  }

  @GetMapping("/customers/pending")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  public List<CustomerVerificationResponse> pendingCustomers() {
    return pendingRegistrationRepository.findAll().stream()
        .map(this::customerVerificationResponse)
        .toList();
  }

  @GetMapping("/customers/{requestId}/documents/{documentType}")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  public ResponseEntity<Resource> pendingCustomerDocument(@PathVariable Long requestId, @PathVariable String documentType) {
    PendingRegistration pendingRegistration = pendingRegistrationRepository.findById(requestId)
        .orElseThrow(() -> new BadRequestException("Pending registration not found"));
    return registrationDocumentResponse(documentNameForType(pendingRegistration, documentType));
  }

  @PatchMapping("/customers/{requestId}/verify")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @Transactional
  public CustomerVerificationResponse verifyCustomer(@PathVariable Long requestId) {
    PendingRegistration pendingRegistration = pendingRegistrationRepository.findById(requestId)
        .orElseThrow(() -> new BadRequestException("Pending registration not found"));
    if (userRepository.existsByEmail(pendingRegistration.getEmail())) {
      throw new BadRequestException("Email is already registered");
    }
    if (pendingRegistration.getMobile() != null && userRepository.existsByMobile(pendingRegistration.getMobile())) {
      throw new BadRequestException("Mobile is already registered");
    }

    Role customerRole = roleRepository.findByName(RoleName.CUSTOMER)
        .orElseThrow(() -> new BadRequestException("Customer role is not configured"));

    User customer = User.builder()
        .fullName(pendingRegistration.getFullName())
        .firstName(pendingRegistration.getFirstName())
        .lastName(pendingRegistration.getLastName())
        .email(pendingRegistration.getEmail())
        .mobile(pendingRegistration.getMobile())
        .gender(pendingRegistration.getGender())
        .dob(pendingRegistration.getDob())
        .alternateContactNumber(pendingRegistration.getAlternateContactNumber())
        .currentAddress(pendingRegistration.getCurrentAddress())
        .city(pendingRegistration.getCity())
        .state(pendingRegistration.getState())
        .pincode(pendingRegistration.getPincode())
        .country(pendingRegistration.getCountry())
        .residenceType(pendingRegistration.getResidenceType())
        .occupation(pendingRegistration.getOccupation())
        .companyName(pendingRegistration.getCompanyName())
        .socialMediaProfile(pendingRegistration.getSocialMediaProfile())
        .photoDocumentName(pendingRegistration.getPhotoDocumentName())
        .drivingLicenseDocumentName(pendingRegistration.getDrivingLicenseDocumentName())
        .electricityBillDocumentName(pendingRegistration.getElectricityBillDocumentName())
        .rentAgreementDocumentName(pendingRegistration.getRentAgreementDocumentName())
        .companyBonafideLetterDocumentName(pendingRegistration.getCompanyBonafideLetterDocumentName())
        .password(pendingRegistration.getPassword())
        .enabled(true)
        .mobileVerified(false)
        .roles(Set.of(customerRole))
        .build();

    User savedCustomer = userRepository.save(customer);
    sendCustomerApprovedEmail(savedCustomer);
    CustomerVerificationResponse response = customerVerificationResponse(pendingRegistration);
    pendingRegistrationRepository.delete(pendingRegistration);
    return new CustomerVerificationResponse(
        response.requestId(),
        response.fullName(),
        response.firstName(),
        response.lastName(),
        response.email(),
        response.mobile(),
        response.gender(),
        response.dob(),
        response.alternateContactNumber(),
        response.currentAddress(),
        response.city(),
        response.state(),
        response.pincode(),
        response.country(),
        response.residenceType(),
        response.occupation(),
        response.companyName(),
        response.socialMediaProfile(),
        "VERIFIED",
        response.documents()
    );
  }

  private CustomerVerificationResponse customerVerificationResponse(PendingRegistration pendingRegistration) {
    return new CustomerVerificationResponse(
        pendingRegistration.getId(),
        pendingRegistration.getFullName(),
        pendingRegistration.getFirstName(),
        pendingRegistration.getLastName(),
        pendingRegistration.getEmail(),
        pendingRegistration.getMobile(),
        pendingRegistration.getGender(),
        pendingRegistration.getDob(),
        pendingRegistration.getAlternateContactNumber(),
        pendingRegistration.getCurrentAddress(),
        pendingRegistration.getCity(),
        pendingRegistration.getState(),
        pendingRegistration.getPincode(),
        pendingRegistration.getCountry(),
        pendingRegistration.getResidenceType(),
        pendingRegistration.getOccupation(),
        pendingRegistration.getCompanyName(),
        pendingRegistration.getSocialMediaProfile(),
        "PENDING_VERIFICATION",
        documentsFor(pendingRegistration)
    );
  }

  private void sendCustomerApprovedEmail(User customer) {
    if (!isMailConfigured()) {
      log.warn("Skipping account approval email for {} because MAIL_USERNAME or MAIL_PASSWORD is not configured", customer.getEmail());
      return;
    }

    try {
      SimpleMailMessage message = new SimpleMailMessage();
      message.setFrom(configuredMailUsername());
      message.setTo(customer.getEmail());
      message.setSubject("Your ClickKaar Account Has Been Approved");
      message.setText(
          "Dear " + customer.getFullName() + ",\n\n"
              + "Congratulations! Your account has been successfully verified and approved by the ClickKaar team.\n\n"
              + "You can now log in to your ClickKaar account and start exploring all the features and services available on our platform.\n\n"
              + "Login Details:\n\n"
              + "- Email: " + customer.getEmail() + "\n"
              + "- Login URL: " + configuredLoginUrl() + "\n\n"
              + "We are excited to have you as part of the ClickKaar community and look forward to supporting your journey with us.\n\n"
              + "If you have any questions or need assistance, please do not hesitate to contact our support team.\n\n"
              + "Best Regards,\n"
              + "The ClickKaar Team\n"
              + "ClickKaar Support\n"
              + "Email: support@clickkaar.com\n"
              + "Website: https://clickkaar.com"
      );
      mailSender.send(message);
      log.info("Account approval email sent to {}", customer.getEmail());
    } catch (MailAuthenticationException exception) {
      log.warn("Unable to send account approval email to {} because SMTP authentication failed for {}", customer.getEmail(), configuredMailUsername());
    } catch (MailException exception) {
      log.warn("Unable to send account approval email to {}", customer.getEmail(), exception);
    }
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

  private List<RegistrationDocumentResponse> documentsFor(PendingRegistration pendingRegistration) {
    List<RegistrationDocumentResponse> documents = new ArrayList<>();
    addDocument(documents, "photo", "Photo", pendingRegistration.getPhotoDocumentName());
    addDocument(documents, "drivingLicense", "Driving license", pendingRegistration.getDrivingLicenseDocumentName());
    addDocument(documents, "electricityBill", "Electricity bill", pendingRegistration.getElectricityBillDocumentName());
    addDocument(documents, "rentAgreement", "Rent agreement", pendingRegistration.getRentAgreementDocumentName());
    addDocument(documents, "companyBonafideLetter", "Company bonafide letter", pendingRegistration.getCompanyBonafideLetterDocumentName());
    return documents;
  }

  private void addDocument(List<RegistrationDocumentResponse> documents, String type, String label, String documentName) {
    if (documentName != null && !documentName.isBlank()) {
      documents.add(new RegistrationDocumentResponse(type, label, Path.of(documentName).getFileName().toString()));
    }
  }

  private String documentNameForType(PendingRegistration pendingRegistration, String documentType) {
    return switch (documentType) {
      case "photo" -> pendingRegistration.getPhotoDocumentName();
      case "drivingLicense" -> pendingRegistration.getDrivingLicenseDocumentName();
      case "electricityBill" -> pendingRegistration.getElectricityBillDocumentName();
      case "rentAgreement" -> pendingRegistration.getRentAgreementDocumentName();
      case "companyBonafideLetter" -> pendingRegistration.getCompanyBonafideLetterDocumentName();
      default -> null;
    };
  }

  private List<RegistrationDocumentResponse> documentsFor(User customer) {
    List<RegistrationDocumentResponse> documents = new ArrayList<>();
    addDocument(documents, "photo", "Photo", customer.getPhotoDocumentName());
    addDocument(documents, "drivingLicense", "Driving license", customer.getDrivingLicenseDocumentName());
    addDocument(documents, "electricityBill", "Electricity bill", customer.getElectricityBillDocumentName());
    addDocument(documents, "rentAgreement", "Rent agreement", customer.getRentAgreementDocumentName());
    addDocument(documents, "companyBonafideLetter", "Company bonafide letter", customer.getCompanyBonafideLetterDocumentName());
    return documents;
  }

  private String documentNameForType(User customer, String documentType) {
    return switch (documentType) {
      case "photo" -> customer.getPhotoDocumentName();
      case "drivingLicense" -> customer.getDrivingLicenseDocumentName();
      case "electricityBill" -> customer.getElectricityBillDocumentName();
      case "rentAgreement" -> customer.getRentAgreementDocumentName();
      case "companyBonafideLetter" -> customer.getCompanyBonafideLetterDocumentName();
      default -> null;
    };
  }

  private ResponseEntity<Resource> registrationDocumentResponse(String documentName) {
    if (documentName == null || documentName.isBlank()) {
      throw new BadRequestException("Registration document not found");
    }

    Path documentPath = Path.of(documentName).normalize();
    Path uploadRoot = Path.of("uploads", "registration-documents").toAbsolutePath().normalize();
    Path absoluteDocumentPath = documentPath.toAbsolutePath().normalize();
    if (!absoluteDocumentPath.startsWith(uploadRoot) || !Files.exists(absoluteDocumentPath)) {
      throw new BadRequestException("Registration document not found");
    }

    try {
      Resource resource = new UrlResource(absoluteDocumentPath.toUri());
      String contentType = Files.probeContentType(absoluteDocumentPath);
      MediaType mediaType = contentType == null ? MediaType.APPLICATION_OCTET_STREAM : MediaType.parseMediaType(contentType);
      return ResponseEntity.ok()
          .contentType(mediaType)
          .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + absoluteDocumentPath.getFileName() + "\"")
          .body(resource);
    } catch (MalformedURLException exception) {
      throw new BadRequestException("Unable to read registration document");
    } catch (Exception exception) {
      throw new BadRequestException("Unable to read registration document");
    }
  }

  private AdminBookingResponse adminBookingResponse(Booking booking) {
    List<Payment> payments = paymentRepository.findAll().stream()
        .filter(payment -> Objects.equals(payment.getBooking().getId(), booking.getId()))
        .toList();
    PaymentStatus paymentStatus = payments.stream()
        .map(Payment::getStatus)
        .filter(status -> status == PaymentStatus.PAID || status == PaymentStatus.REFUNDED)
        .findFirst()
        .orElse(payments.isEmpty() ? PaymentStatus.PENDING : payments.get(payments.size() - 1).getStatus());
    String returnStatus = returnStatusFor(booking);
    List<String> notes = bookingNoteRepository.findByBookingId(booking.getId()).stream().map(BookingNote::getNote).toList();
    return new AdminBookingResponse(
        booking.getId(),
        booking.getBookingNumber(),
        booking.getCustomer().getFullName(),
        booking.getCustomer().getMobile(),
        booking.getItems().stream().map(this::productName).toList(),
        booking.getRentalStartDate(),
        booking.getRentalEndDate(),
        booking.getStatus(),
        paymentStatus,
        returnStatus,
        booking.getTotalAmount(),
        notes,
        booking.isDeliveryOtpVerified()
    );
  }

  private AdminCustomerResponse adminCustomerResponse(User customer) {
    List<Booking> bookings = bookingRepository.findByCustomerId(customer.getId());
    long activeBookings = bookings.stream()
        .filter(booking -> booking.getStatus() == BookingStatus.ACTIVE || booking.getStatus() == BookingStatus.CONFIRMED || booking.getStatus() == BookingStatus.OVERDUE)
        .count();
    long pastBookings = bookings.stream()
        .filter(booking -> booking.getStatus() == BookingStatus.COMPLETED)
        .count();
    return new AdminCustomerResponse(
        customer.getId(),
        customer.getFullName(),
        customer.getEmail(),
        customer.getMobile(),
        customer.isMobileVerified(),
        !customer.isEnabled(),
        customer.getCity(),
        (int) wishlistRepository.countExistingProductsByUserId(customer.getId()),
        activeBookings,
        pastBookings
    );
  }

  private AdminCustomerDetailResponse adminCustomerDetailResponse(User customer) {
    AdminCustomerResponse summary = adminCustomerResponse(customer);
    return new AdminCustomerDetailResponse(
        summary.id(),
        summary.name(),
        customer.getFirstName(),
        customer.getLastName(),
        summary.email(),
        summary.phone(),
        customer.getGender(),
        customer.getDob(),
        customer.getAlternateContactNumber(),
        customer.getCurrentAddress(),
        summary.city(),
        customer.getState(),
        customer.getPincode(),
        customer.getCountry(),
        customer.getResidenceType(),
        customer.getOccupation(),
        customer.getCompanyName(),
        customer.getSocialMediaProfile(),
        summary.verified(),
        summary.blocked(),
        summary.wishlist(),
        summary.activeBookings(),
        summary.pastBookings(),
        documentsFor(customer)
    );
  }
  private String productName(BookingItem item) {
    try {
      return item.getProduct() == null ? "Unavailable product" : item.getProduct().getName();
    } catch (EntityNotFoundException exception) {
      return "Unavailable product";
    }
  }

  private AdminPaymentResponse adminPaymentResponse(Payment payment) {
    return new AdminPaymentResponse(
        payment.getId(),
        payment.getBooking().getBookingNumber(),
        payment.getBooking().getCustomer().getFullName(),
        "Razorpay",
        payment.getType().name(),
        payment.getStatus(),
        payment.getAmount(),
        payment.getUpdatedAt(),
        payment.getRemark(),
        paymentRemarkLogRepository.countByPaymentId(payment.getId())
    );
  }

  private AdminCouponResponse adminCouponResponse(Coupon coupon) {
    return new AdminCouponResponse(
        coupon.getId(),
        coupon.getCode(),
        coupon.getDiscountPercent(),
        coupon.isActive(),
        coupon.getUsageLimit(),
        coupon.getUsedCount() == null ? 0 : coupon.getUsedCount(),
        coupon.getValidUntil(),
        coupon.getCreatedAt()
    );
  }

  private String normalizeCouponCode(String code) {
    return code == null ? "" : code.trim().toUpperCase();
  }

  private User currentAdmin() {
    String email = SecurityContextHolder.getContext().getAuthentication().getName();
    return userRepository.findByEmail(email)
        .orElseThrow(() -> new BadRequestException("Admin user not found"));
  }

  private RoleName employeeRoleName(String role) {
    return switch (role == null ? "" : role.trim().toUpperCase()) {
      case "MANAGER" -> RoleName.MANAGER;
      case "INVENTORY_STAFF", "INVENTORY" -> RoleName.INVENTORY_STAFF;
      case "CONTENT_EDITOR", "CONTENT" -> RoleName.CONTENT_EDITOR;
      default -> throw new BadRequestException("Select a valid employee role");
    };
  }

  private String returnStatusFor(Booking booking) {
    if (booking.getStatus() == BookingStatus.COMPLETED) {
      return "RETURNED";
    }
    if (booking.getStatus() == BookingStatus.OVERDUE || (booking.getRentalEndDate().isBefore(LocalDate.now()) && booking.getStatus() != BookingStatus.CANCELLED)) {
      return "LATE";
    }
    if (booking.getRentalEndDate().isEqual(LocalDate.now())) {
      return "DUE_TODAY";
    }
    return "NOT_DUE";
  }

  private ProductRequest productRequestWithImage(String productJson, MultipartFile image) {
    try {
      ProductRequest request = objectMapper.readValue(productJson, ProductRequest.class);
      if (image == null || image.isEmpty()) {
        return request;
      }
      String imageUrl = contentService.uploadImage(image);
      return new ProductRequest(
          request.name(),
          request.brand(),
          request.category(),
          request.shortDescription(),
          request.fullDescription(),
          request.specs(),
          request.dailyPrice(),
          request.weeklyPrice(),
          request.warrantyDate(),
          request.invoiceUrl(),
          imageUrl,
          request.link1(),
          request.link2(),
          request.stock(),
          request.availabilityStatus(),
          List.of(imageUrl)
      );
    } catch (IOException exception) {
      throw new BadRequestException("Invalid product data");
    }
  }

  public record BookingStatusRequest(BookingStatus status) {}
  public record BookingNoteRequest(String note) {}
  public record DeliveryOtpRequest(String otp) {}
  public record PaymentRemarkRequest(String remark) {}
  public record CustomerBlockRequest(boolean blocked) {}
  public record AdminRefundRequest(BigDecimal amount, String reason) {}
  public record ReviewReplyRequest(String reply) {}
  public record AdminCouponRequest(String code, BigDecimal discountPercent, Boolean active, Integer usageLimit, LocalDate validUntil) {}
  public record CouponActiveRequest(boolean active) {}
  public record AdminBookingResponse(Long id, String bookingNumber, String customer, String phone, List<String> products, LocalDate startDate, LocalDate endDate, BookingStatus status, PaymentStatus paymentStatus, String returnStatus, BigDecimal total, List<String> notes, boolean deliveryOtpVerified) {}
  public record AdminCustomerResponse(Long id, String name, String email, String phone, boolean verified, boolean blocked, String city, int wishlist, long activeBookings, long pastBookings) {}
  public record AdminCustomerDetailResponse(Long id, String name, String firstName, String lastName, String email, String phone, String gender, String dob, String alternateContactNumber, String currentAddress, String city, String state, String pincode, String country, String residenceType, String occupation, String companyName, String socialMediaProfile, boolean verified, boolean blocked, int wishlist, long activeBookings, long pastBookings, List<RegistrationDocumentResponse> documents) {}
  public record AdminPaymentResponse(Long id, String bookingId, String customer, String gateway, String mode, PaymentStatus status, BigDecimal amount, LocalDateTime paidAt, String remark, long remarkChangeCount) {}
  public record AdminCouponResponse(Long id, String code, BigDecimal discountPercent, boolean active, Integer usageLimit, int usedCount, LocalDate validUntil, LocalDateTime createdAt) {}
  public record PaymentRemarkLogResponse(Long id, String oldRemark, String newRemark, String changedBy, LocalDateTime changedAt) {}
  public record AdminBlogPostResponse(Long id, String title, String slug, String coverImage, String category, String author, BlogStatus status, LocalDate publishDate, String tags, String seoTitle, String metaDescription, String seoKeywords, String content) {}
  public record ImageUploadResponse(String imageUrl) {}
  public record AdminStaticContentResponse(String key, String title, LocalDateTime updatedAt, String status) {}
  public record AdminContentResponse(List<AdminBlogPostResponse> blogPosts, List<AdminStaticContentResponse> staticContent) {}
  public record CategoryReportResponse(String name, long value) {}
  public record RolePermissionResponse(String module, String superAdmin, String manager, String inventory, String content) {}
  public record AdminSettingsRequest(String gateway, String paymentPolicy, Integer depositPercent, Integer gstPercent, String notificationEmail, String whatsappNumber, String recaptchaKey, String analyticsId) {}
}



