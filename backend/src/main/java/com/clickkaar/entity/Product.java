package com.clickkaar.entity;

import com.clickkaar.enums.AvailabilityStatus;
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
@Table(name = "products")
public class Product extends AuditableEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false)
  private String brand;

  @ManyToOne(optional = false)
  private Category category;

  @Column(length = 500)
  private String shortDescription;

  @Column(columnDefinition = "TEXT")
  private String fullDescription;

  @Column(columnDefinition = "TEXT")
  private String specs;

  @Column(nullable = false, precision = 10, scale = 2)
  private BigDecimal dailyPrice;

  @Column(nullable = false, precision = 10, scale = 2)
  private BigDecimal weeklyPrice;

  private LocalDate warrantyDate;

  private String invoiceUrl;

  @Column(name = "image_link")
  private String imageLink;

  @Column(name = "link_1")
  private String link1;

  @Column(name = "link_2")
  private String link2;

  private Integer stock;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private AvailabilityStatus availabilityStatus;

  @Builder.Default
  @Column(nullable = false)
  private boolean deleted = false;

  @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
  @Builder.Default
  private List<ProductImage> images = new ArrayList<>();
}
