package com.clickkaar.dto.booking;

import java.time.LocalDate;

public record BlockedDateRangeResponse(
    LocalDate startDate,
    LocalDate endDate
) {
}
