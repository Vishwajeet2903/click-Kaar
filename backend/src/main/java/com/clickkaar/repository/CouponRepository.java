package com.clickkaar.repository;

import com.clickkaar.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, Long> {
  boolean existsByCodeIgnoreCase(String code);
  Optional<Coupon> findByCodeIgnoreCaseAndActiveTrue(String code);
}
