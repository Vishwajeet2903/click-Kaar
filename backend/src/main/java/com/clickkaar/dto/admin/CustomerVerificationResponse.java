package com.clickkaar.dto.admin;

import java.util.List;

public record CustomerVerificationResponse(
    Long requestId,
    String fullName,
    String firstName,
    String lastName,
    String email,
    String mobile,
    String gender,
    String dob,
    String alternateContactNumber,
    String currentAddress,
    String city,
    String state,
    String pincode,
    String country,
    String residenceType,
    String occupation,
    String companyName,
    String socialMediaProfile,
    String status,
    List<RegistrationDocumentResponse> documents
) {
}
