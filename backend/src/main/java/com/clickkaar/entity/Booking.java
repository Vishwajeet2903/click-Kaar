package com.clickkaar.entity;

import com.clickkaar.enums.BookingStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

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

  @Column(length = 12)
  private String deliveryOtp;

  @Column(nullable = false)
  @Builder.Default
  private boolean deliveryOtpVerified = false;

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.VARCHAR)
  @Column(nullable = false, length = 32)
  private BookingStatus status;

  @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
  @Builder.Default
  private List<BookingItem> items = new ArrayList<>();
}


