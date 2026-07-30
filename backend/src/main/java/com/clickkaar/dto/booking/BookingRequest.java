package com.clickkaar.dto.booking;

import jakarta.validation.Valid;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record BookingRequest(
    @NotNull Long customerId,
    @NotNull @FutureOrPresent LocalDate rentalStartDate,
    @NotNull @FutureOrPresent LocalDate rentalEndDate,
    @NotEmpty List<@Valid BookingItemRequest> items,
    String paymentMethod
) {
}
