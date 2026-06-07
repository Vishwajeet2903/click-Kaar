package com.clickkaar.dto.booking;

import com.clickkaar.enums.BookingStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record BookingResponse(
    Long id,
    String bookingNumber,
    Long customerId,
    LocalDate rentalStartDate,
    LocalDate rentalEndDate,
    int rentalDays,
    BigDecimal totalAmount,
    BookingStatus status,
    List<String> products
) {
}
