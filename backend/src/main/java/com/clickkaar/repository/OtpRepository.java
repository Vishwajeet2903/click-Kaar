package com.clickkaar.repository;

import com.clickkaar.entity.OTP;
import com.clickkaar.enums.OtpPurpose;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OtpRepository extends JpaRepository<OTP, Long> {
  Optional<OTP> findTopByMobileAndPurposeAndUsedFalseOrderByCreatedAtDesc(String mobile, OtpPurpose purpose);
  Optional<OTP> findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(String email, OtpPurpose purpose);
}
