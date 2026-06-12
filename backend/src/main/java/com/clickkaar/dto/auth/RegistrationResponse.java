package com.clickkaar.dto.auth;

public record RegistrationResponse(
    Long requestId,
    String fullName,
    String email,
    String mobile,
    String status,
    String message
) {
}
