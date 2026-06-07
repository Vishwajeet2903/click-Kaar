package com.clickkaar.service;

import com.clickkaar.dto.booking.BookingRequest;
import com.clickkaar.dto.booking.BookingResponse;
import com.clickkaar.entity.Booking;
import com.clickkaar.entity.BookingItem;
import com.clickkaar.entity.Product;
import com.clickkaar.entity.User;
import com.clickkaar.enums.BookingStatus;
import com.clickkaar.exception.BadRequestException;
import com.clickkaar.exception.ResourceNotFoundException;
import com.clickkaar.repository.BookingRepository;
import com.clickkaar.repository.ProductRepository;
import com.clickkaar.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingService {
  private final BookingRepository bookingRepository;
  private final ProductRepository productRepository;
  private final UserRepository userRepository;

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
      if (bookingRepository.existsOverlappingBooking(item.productId(), request.rentalStartDate(), request.rentalEndDate())) {
        throw new BadRequestException("Product " + item.productId() + " is already booked for selected dates");
      }
      Product product = productRepository.findById(item.productId()).orElseThrow(() -> new ResourceNotFoundException("Product not found"));
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
    return toResponse(bookingRepository.save(booking));
  }

  public List<BookingResponse> all() {
    return bookingRepository.findAll().stream().map(this::toResponse).toList();
  }

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
}
