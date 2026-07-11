package com.clickkaar.repository;

import com.clickkaar.entity.PaymentRemarkLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRemarkLogRepository extends JpaRepository<PaymentRemarkLog, Long> {
  long countByPaymentId(Long paymentId);
  List<PaymentRemarkLog> findByPaymentIdOrderByCreatedAtDesc(Long paymentId);
}
