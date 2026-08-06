package com.clickkaar.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "wishlists", uniqueConstraints = {
    @UniqueConstraint(name = "uk_wishlist_user_product", columnNames = {"user_id", "product_id"})
})
public class Wishlist extends AuditableEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional = false)
  private User user;

  @ManyToOne(optional = false)
  @NotFound(action = NotFoundAction.IGNORE)
  private Product product;
}
