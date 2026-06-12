package com.clickkaar.dto.admin;

public record CustomerVerificationResponse(
    Long requestId,
    String fullName,
    String email,
    String mobile,
    String city,
    String state,
    String occupation,
    String status
) {
}
