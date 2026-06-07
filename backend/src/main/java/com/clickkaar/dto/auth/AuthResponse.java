package com.clickkaar.dto.auth;

import java.util.Set;

public record AuthResponse(
    String token,
    String tokenType,
    Long userId,
    String fullName,
    String email,
    String mobile,
    Set<String> roles
) {
}
