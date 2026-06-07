package com.clickkaar.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "addresses")
public class Address extends AuditableEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional = false)
  private User user;

  private String label;
  private String line1;
  private String line2;
  private String city;
  private String state;
  private String postalCode;
  private String country;
  private boolean defaultAddress;
}
