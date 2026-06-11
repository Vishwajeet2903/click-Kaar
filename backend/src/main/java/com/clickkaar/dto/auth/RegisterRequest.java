package com.clickkaar.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.web.multipart.MultipartFile;

public record RegisterRequest(
    @NotBlank String firstName,
    @NotBlank String lastName,
    @Email @NotBlank String email,
    @NotBlank String gender,
    @NotBlank String dob,
    @Size(min = 6, message = "Password must be at least 6 characters") String password,
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
    MultipartFile rentAgreement
) {
  public String fullName() {
    return firstName.trim() + " " + lastName.trim();
  }

  public String mobile() {
    return phoneNumber;
  }
}
