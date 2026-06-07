package com.clickkaar.repository;

import com.clickkaar.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
  Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);
}
