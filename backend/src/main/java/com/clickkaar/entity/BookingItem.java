package com.clickkaar.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "booking_items")
public class BookingItem {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional = false)
  private Booking booking;

  @ManyToOne(optional = false)
  private Product product;

  @Column(nullable = false, precision = 10, scale = 2)
  private BigDecimal dailyPrice;

  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal lineTotal;
}
