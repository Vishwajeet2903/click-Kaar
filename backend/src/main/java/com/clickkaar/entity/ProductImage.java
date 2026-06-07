package com.clickkaar.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "product_images")
public class ProductImage {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String imageUrl;

  private String publicId;
  private boolean primaryImage;

  @ManyToOne(optional = false)
  @JoinColumn(name = "product_id")
  private Product product;
}
