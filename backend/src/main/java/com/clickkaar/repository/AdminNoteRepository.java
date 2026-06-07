package com.clickkaar.repository;

import com.clickkaar.entity.AdminNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AdminNoteRepository extends JpaRepository<AdminNote, Long> {
  List<AdminNote> findByBookingId(Long bookingId);
}
