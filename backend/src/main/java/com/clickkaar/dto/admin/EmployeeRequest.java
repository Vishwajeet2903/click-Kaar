package com.clickkaar.dto.admin;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EmployeeRequest(
    @NotBlank String fullName,
    @Email @NotBlank String email,
    @NotBlank String mobile,
    @NotBlank String role,
    @Size(min = 6, message = "Password must be at least 6 characters") String password
) {
}
