package com.clickkaar.dto.booking;

import java.math.BigDecimal;

public record CouponPreviewResponse(
    String code,
    BigDecimal discountPercent
) {
}
