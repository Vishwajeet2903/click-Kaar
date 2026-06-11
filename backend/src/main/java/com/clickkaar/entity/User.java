package com.clickkaar.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_users_email", columnList = "email"),
    @Index(name = "idx_users_mobile", columnList = "mobile")
})
public class User extends AuditableEntity {
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
  private String drivingLicenseDocumentName;
  private String electricityBillDocumentName;
  private String rentAgreementDocumentName;

  @Column(nullable = false)
  private String password;

  private boolean enabled;
  private boolean mobileVerified;

  @ManyToMany(fetch = FetchType.EAGER)
  @JoinTable(
      name = "user_roles",
      joinColumns = @JoinColumn(name = "user_id"),
      inverseJoinColumns = @JoinColumn(name = "role_id")
  )
  @Builder.Default
  private Set<Role> roles = new HashSet<>();
}
