package com.clickkaar.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "customer_reviews")
public class CustomerReview extends AuditableEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false)
  private String role;

  @Column(nullable = false)
  private Integer rating;

  @Column(columnDefinition = "TEXT", nullable = false)
  private String quote;

  @Column(columnDefinition = "TEXT")
  private String adminReply;

  private String avatar;
}
