package com.clickkaar.dto.admin;

import java.util.Set;

public record EmployeeResponse(
    Long userId,
    String fullName,
    String email,
    String mobile,
    Set<String> roles
) {
}
