package com.clickkaar.repository;

import com.clickkaar.entity.Booking;
import com.clickkaar.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
  List<Booking> findByCustomerId(Long customerId);
  List<Booking> findByStatus(BookingStatus status);

  @Query("""
      select count(bi) > 0
      from BookingItem bi
      where bi.product.id = :productId
        and bi.booking.status in (com.clickkaar.enums.BookingStatus.PENDING, com.clickkaar.enums.BookingStatus.CONFIRMED, com.clickkaar.enums.BookingStatus.ACTIVE)
        and :startDate <= bi.booking.rentalEndDate
        and :endDate >= bi.booking.rentalStartDate
      """)
  boolean existsOverlappingBooking(@Param("productId") Long productId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
