package com.clickkaar.repository;

import com.clickkaar.entity.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface WishlistRepository extends JpaRepository<Wishlist, Long> {
  List<Wishlist> findByUserId(Long userId);

  @Query("""
      select count(w)
      from Wishlist w
      join w.product p
      where w.user.id = :userId
      """)
  long countExistingProductsByUserId(@Param("userId") Long userId);

  boolean existsByUserIdAndProductId(Long userId, Long productId);
  void deleteByUserIdAndProductId(Long userId, Long productId);
}
