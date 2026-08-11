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
  boolean existsByCustomerIdAndStatusIn(Long customerId, List<BookingStatus> statuses);
  List<Booking> findByStatus(BookingStatus status);
  boolean existsByBookingNumber(String bookingNumber);
  long countByBookingNumberStartingWith(String prefix);
  boolean existsByCustomerIdAndRentalStartDateAndRentalEndDate(Long customerId, LocalDate rentalStartDate, LocalDate rentalEndDate);

  @Query("""
      select count(bi) > 0
      from BookingItem bi
      where bi.product.id = :productId
        and bi.booking.status in (com.clickkaar.enums.BookingStatus.CONFIRMED, com.clickkaar.enums.BookingStatus.ACTIVE, com.clickkaar.enums.BookingStatus.OVERDUE)
        and :startDate <= bi.booking.rentalEndDate
        and :endDate >= bi.booking.rentalStartDate
      """)
  boolean existsOverlappingBooking(@Param("productId") Long productId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

  @Query("""
      select distinct b
      from Booking b
      join fetch b.items bi
      where bi.product.id = :productId
        and b.status in (com.clickkaar.enums.BookingStatus.CONFIRMED, com.clickkaar.enums.BookingStatus.ACTIVE, com.clickkaar.enums.BookingStatus.OVERDUE)
        and :startDate <= b.rentalEndDate
        and :endDate >= b.rentalStartDate
      """)
  List<Booking> findOverlappingBookingsForProduct(@Param("productId") Long productId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

  @Query("""
      select distinct bi.booking
      from BookingItem bi
      where bi.product.id = :productId
        and bi.booking.status in (com.clickkaar.enums.BookingStatus.CONFIRMED, com.clickkaar.enums.BookingStatus.ACTIVE, com.clickkaar.enums.BookingStatus.OVERDUE)
        and bi.booking.rentalEndDate >= :fromDate
      order by bi.booking.rentalStartDate
      """)
  List<Booking> findBlockedRangesForProduct(@Param("productId") Long productId, @Param("fromDate") LocalDate fromDate);
}
