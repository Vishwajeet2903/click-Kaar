package com.clickkaar.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.web.multipart.MultipartFile;

public record RegisterRequest(
    @NotBlank String firstName,
    @NotBlank String lastName,
    @NotBlank
    @Pattern(
        regexp = "^(?!.*\\.\\.)[A-Za-z0-9_%+-]+(?:\\.[A-Za-z0-9_%+-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\\.)+[A-Za-z]{2,63}$",
        message = "Enter a valid email address, for example name@example.com"
    )
    String email,
    @NotBlank String gender,
    @NotBlank String dob,
    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 64, message = "Password must be 8-64 characters")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9])\\S{8,64}$",
        message = "Password must include uppercase, lowercase, number, and special character"
    )
    String password,
    @NotBlank String phoneNumber,
    String alternateContactNumber,
    @NotBlank String currentAddress,
    @NotBlank String city,
    @NotBlank String state,
    @NotBlank String pincode,
    @NotBlank String country,
    @NotBlank String residenceType,
    @NotBlank String occupation,
    @NotBlank String companyName,
    @NotBlank String socialMediaProfile,
    MultipartFile photo,
    MultipartFile drivingLicense,
    MultipartFile electricityBill,
    MultipartFile rentAgreement,
    MultipartFile companyBonafideLetter
) {
  public String fullName() {
    return firstName.trim() + " " + lastName.trim();
  }

  public String mobile() {
    return phoneNumber;
  }
}
