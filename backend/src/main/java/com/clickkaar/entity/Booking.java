package com.clickkaar.entity;

import com.clickkaar.enums.BookingStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "bookings")
public class Booking extends AuditableEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  private String bookingNumber;

  @ManyToOne(optional = false)
  private User customer;

  @Column(nullable = false)
  private LocalDate rentalStartDate;

  @Column(nullable = false)
  private LocalDate rentalEndDate;

  @Column(nullable = false)
  private int rentalDays;

  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal totalAmount;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private BookingStatus status;

  @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
  @Builder.Default
  private List<BookingItem> items = new ArrayList<>();
}
