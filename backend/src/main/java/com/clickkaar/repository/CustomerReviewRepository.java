package com.clickkaar.repository;

import com.clickkaar.entity.CustomerReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerReviewRepository extends JpaRepository<CustomerReview, Long> {
  boolean existsByNameIgnoreCaseAndQuoteIgnoreCase(String name, String quote);

  List<CustomerReview> findAllByOrderByCreatedAtDesc();
}
