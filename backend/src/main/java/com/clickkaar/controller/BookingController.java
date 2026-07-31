package com.clickkaar.controller;

import com.clickkaar.dto.booking.AvailabilityResponse;
import com.clickkaar.dto.booking.BlockedDateRangeResponse;
import com.clickkaar.dto.booking.BookingRequest;
import com.clickkaar.dto.booking.BookingResponse;
import com.clickkaar.dto.booking.CouponPreviewResponse;
import com.clickkaar.enums.BookingStatus;
import com.clickkaar.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {
  private final BookingService bookingService;

  @PostMapping
  public BookingResponse create(@Valid @RequestBody BookingRequest request) {
    return bookingService.create(request);
  }

  @GetMapping("/availability")
  public AvailabilityResponse availability(
      @RequestParam Long productId,
      @RequestParam LocalDate startDate,
      @RequestParam LocalDate endDate
  ) {
    return bookingService.availability(productId, startDate, endDate);
  }

  @GetMapping("/products/{productId}/blocked-ranges")
  public List<BlockedDateRangeResponse> blockedRanges(@PathVariable Long productId) {
    return bookingService.blockedRanges(productId);
  }

  @GetMapping("/coupons/{couponCode}")
  public CouponPreviewResponse couponPreview(@PathVariable String couponCode) {
    return bookingService.couponPreview(couponCode);
  }

  @GetMapping("/customer/{customerId}")
  public List<BookingResponse> customerBookings(@PathVariable Long customerId) {
    return bookingService.byCustomer(customerId);
  }

  @GetMapping
  @PreAuthorize("hasRole('ADMIN')")
  public List<BookingResponse> all() {
    return bookingService.all();
  }

  @PatchMapping("/{bookingId}/status")
  @PreAuthorize("hasRole('ADMIN')")
  public BookingResponse updateStatus(@PathVariable Long bookingId, @RequestParam BookingStatus status) {
    return bookingService.updateStatus(bookingId, status);
  }
}
