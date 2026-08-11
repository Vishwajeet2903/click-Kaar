package com.clickkaar.repository;

import com.clickkaar.entity.BookingNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookingNoteRepository extends JpaRepository<BookingNote, Long> {
  List<BookingNote> findByBookingId(Long bookingId);
  void deleteByBookingCustomerId(Long customerId);
}
