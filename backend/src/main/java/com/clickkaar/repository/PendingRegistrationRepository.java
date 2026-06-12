package com.clickkaar.repository;

import com.clickkaar.entity.PendingRegistration;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PendingRegistrationRepository extends JpaRepository<PendingRegistration, Long> {
  boolean existsByEmail(String email);
  boolean existsByMobile(String mobile);
}
