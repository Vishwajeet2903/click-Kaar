package com.clickkaar.dto.booking;

public record AvailabilityResponse(
    boolean available,
    String message
) {
}
