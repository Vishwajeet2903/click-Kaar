package com.clickkaar.dto.booking;

import jakarta.validation.constraints.NotNull;

public record BookingItemRequest(@NotNull Long productId) {
}
