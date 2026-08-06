package com.clickkaar.controller;

import com.clickkaar.entity.Booking;
import com.clickkaar.entity.BookingItem;
import com.clickkaar.entity.Payment;
import com.clickkaar.entity.User;
import com.clickkaar.enums.BookingStatus;
import com.clickkaar.enums.PaymentStatus;
import com.clickkaar.exception.BadRequestException;
import com.clickkaar.repository.BookingRepository;
import com.clickkaar.repository.PaymentRepository;
import com.clickkaar.repository.UserRepository;
import com.clickkaar.repository.WishlistRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@PreAuthorize("hasRole('CUSTOMER')")
@RequiredArgsConstructor
public class CustomerDashboardController {
  private static final DateTimeFormatter DISPLAY_DATE = DateTimeFormatter.ofPattern("MMM d, yyyy");

  private final BookingRepository bookingRepository;
  private final PaymentRepository paymentRepository;
  private final UserRepository userRepository;
  private final WishlistRepository wishlistRepository;

  @GetMapping("/customer")
  @Transactional(readOnly = true)
  public CustomerDashboardResponse customerDashboard() {
    User customer = currentCustomer();
    List<Booking> bookings = bookingRepository.findByCustomerId(customer.getId()).stream()
        .sorted(Comparator.comparing(Booking::getRentalStartDate).reversed())
        .toList();
    List<Payment> payments = paymentRepository.findByBookingCustomerId(customer.getId()).stream()
        .sorted(Comparator.comparing(Payment::getUpdatedAt).reversed())
        .toList();

    long activeBookings = bookings.stream()
        .filter(booking -> Set.of(BookingStatus.ACTIVE, BookingStatus.CONFIRMED, BookingStatus.PENDING).contains(booking.getStatus()))
        .count();
    long pastBookings = bookings.stream()
        .filter(booking -> Set.of(BookingStatus.COMPLETED, BookingStatus.CANCELLED).contains(booking.getStatus()))
        .count();
    long upcomingReturns = bookings.stream()
        .filter(booking -> booking.getRentalEndDate() != null && !booking.getRentalEndDate().isBefore(LocalDate.now()))
        .filter(booking -> booking.getStatus() != BookingStatus.COMPLETED && booking.getStatus() != BookingStatus.CANCELLED)
        .count();
    BigDecimal totalSpent = payments.stream()
        .filter(payment -> payment.getStatus() == PaymentStatus.PAID)
        .map(Payment::getAmount)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
    long pendingPayments = payments.stream()
        .filter(payment -> payment.getStatus() == PaymentStatus.PENDING)
        .count();

    CustomerProfileResponse profile = new CustomerProfileResponse(
        customer.getId(),
        customer.getFullName(),
        customer.getEmail(),
        customer.getMobile(),
        customer.isMobileVerified(),
        customer.getCity(),
        customer.getRoles().stream().map(role -> role.getName().name()).collect(Collectors.toSet())
    );
    CustomerDashboardSummaryResponse summary = new CustomerDashboardSummaryResponse(
        activeBookings,
        pastBookings,
        upcomingReturns,
        (int) wishlistRepository.countExistingProductsByUserId(customer.getId()),
        totalSpent,
        pendingPayments
    );
    return new CustomerDashboardResponse(
        profile,
        summary,
        bookings.stream().map(this::bookingResponse).toList(),
        payments.stream().map(this::paymentResponse).toList()
    );
  }

  private CustomerBookingResponse bookingResponse(Booking booking) {
    List<String> products = booking.getItems().stream()
        .map(this::productName)
        .toList();
    return new CustomerBookingResponse(
        booking.getId(),
        booking.getBookingNumber(),
        products,
        products.isEmpty() ? "Booking item" : products.get(0),
        booking.getRentalStartDate(),
        booking.getRentalEndDate(),
        dateRange(booking),
        booking.getRentalDays(),
        booking.getStatus(),
        bookingGroup(booking),
        returnStatus(booking),
        booking.getTotalAmount()
    );
  }

  private String productName(BookingItem item) {
    try {
      return item.getProduct() == null ? "Unavailable product" : item.getProduct().getName();
    } catch (EntityNotFoundException exception) {
      return "Unavailable product";
    }
  }

  private CustomerPaymentResponse paymentResponse(Payment payment) {
    return new CustomerPaymentResponse(
        payment.getId(),
        payment.getBooking().getBookingNumber(),
        payment.getType().name(),
        payment.getStatus(),
        payment.getAmount(),
        payment.getUpdatedAt()
    );
  }

  private User currentCustomer() {
    String email = SecurityContextHolder.getContext().getAuthentication().getName();
    return userRepository.findByEmail(email)
        .orElseThrow(() -> new BadRequestException("Customer user not found"));
  }

  private String bookingGroup(Booking booking) {
    if (booking.getStatus() == BookingStatus.COMPLETED || booking.getStatus() == BookingStatus.CANCELLED) {
      return "Past";
    }
    if (booking.getRentalStartDate().isAfter(LocalDate.now())) {
      return "Upcoming";
    }
    return "Active";
  }

  private String returnStatus(Booking booking) {
    if (booking.getStatus() == BookingStatus.COMPLETED) {
      return "RETURNED";
    }
    if (booking.getStatus() == BookingStatus.OVERDUE || booking.getRentalEndDate().isBefore(LocalDate.now())) {
      return "LATE";
    }
    if (booking.getRentalEndDate().isEqual(LocalDate.now())) {
      return "DUE_TODAY";
    }
    return "NOT_DUE";
  }

  private String dateRange(Booking booking) {
    return booking.getRentalStartDate().format(DISPLAY_DATE) + " - " + booking.getRentalEndDate().format(DISPLAY_DATE);
  }

  public record CustomerDashboardResponse(CustomerProfileResponse profile, CustomerDashboardSummaryResponse summary, List<CustomerBookingResponse> bookings, List<CustomerPaymentResponse> payments) {}
  public record CustomerProfileResponse(Long id, String fullName, String email, String mobile, boolean mobileVerified, String city, Set<String> roles) {}
  public record CustomerDashboardSummaryResponse(long activeBookings, long pastBookings, long upcomingReturns, int wishlistCount, BigDecimal totalSpent, long pendingPayments) {}
  public record CustomerBookingResponse(Long id, String bookingNumber, List<String> products, String productName, LocalDate startDate, LocalDate endDate, String dateRange, int rentalDays, BookingStatus status, String group, String returnStatus, BigDecimal total) {}
  public record CustomerPaymentResponse(Long id, String bookingNumber, String type, PaymentStatus status, BigDecimal amount, java.time.LocalDateTime paidAt) {}
}
