package com.clickkaar.entity;

import com.clickkaar.enums.PaymentStatus;
import com.clickkaar.enums.PaymentType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "payments")
public class Payment extends AuditableEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional = false)
  private Booking booking;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private PaymentType type;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private PaymentStatus status;

  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal amount;

  private String razorpayOrderId;
  private String razorpayPaymentId;
  private String razorpaySignature;
}
