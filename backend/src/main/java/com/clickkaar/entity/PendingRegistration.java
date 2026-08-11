package com.clickkaar.entity;

import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "pending_registrations", indexes = {
    @Index(name = "idx_pending_registrations_email", columnList = "email"),
    @Index(name = "idx_pending_registrations_mobile", columnList = "mobile")
})
public class PendingRegistration extends AuditableEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String fullName;

  @Column(nullable = false, unique = true)
  private String email;

  @Column(unique = true)
  private String mobile;

  private String firstName;
  private String lastName;
  private String gender;
  private String dob;
  private String alternateContactNumber;

  @Column(length = 1000)
  private String currentAddress;

  private String city;
  private String state;
  private String pincode;
  private String country;
  private String residenceType;
  private String occupation;
  private String companyName;
  private String socialMediaProfile;
  private String photoDocumentName;
  private String photoDocumentContentType;
  @Lob
  @Basic(fetch = FetchType.LAZY)
  private byte[] photoDocumentData;
  private String drivingLicenseDocumentName;
  private String drivingLicenseDocumentContentType;
  @Lob
  @Basic(fetch = FetchType.LAZY)
  private byte[] drivingLicenseDocumentData;
  private String electricityBillDocumentName;
  private String electricityBillDocumentContentType;
  @Lob
  @Basic(fetch = FetchType.LAZY)
  private byte[] electricityBillDocumentData;
  private String rentAgreementDocumentName;
  private String rentAgreementDocumentContentType;
  @Lob
  @Basic(fetch = FetchType.LAZY)
  private byte[] rentAgreementDocumentData;
  private String companyBonafideLetterDocumentName;
  private String companyBonafideLetterDocumentContentType;
  @Lob
  @Basic(fetch = FetchType.LAZY)
  private byte[] companyBonafideLetterDocumentData;

  @Column(nullable = false)
  private String password;
}
