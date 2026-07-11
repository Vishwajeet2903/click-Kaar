package com.clickkaar.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "payment_remark_logs")
public class PaymentRemarkLog extends AuditableEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional = false)
  private Payment payment;

  @Column(length = 1000)
  private String oldRemark;

  @Column(length = 1000)
  private String newRemark;

  private String changedBy;
}
