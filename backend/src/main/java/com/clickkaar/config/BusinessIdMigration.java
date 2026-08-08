package com.clickkaar.config;

import com.clickkaar.entity.Booking;
import com.clickkaar.repository.BookingRepository;
import com.clickkaar.util.BusinessIdFormatter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
@RequiredArgsConstructor
@Order(Ordered.LOWEST_PRECEDENCE)
public class BusinessIdMigration implements ApplicationRunner {
  private static final DateTimeFormatter DATE_CODE = DateTimeFormatter.ofPattern("yyMMdd");
  private static final Pattern ORDER_PATTERN = Pattern.compile("^ORD-(\\d{6})-(\\d{2,})$");

  private final BookingRepository bookingRepository;

  @Override
  @Transactional
  public void run(ApplicationArguments args) {
    List<Booking> bookings = bookingRepository.findAll().stream()
        .sorted(Comparator
            .comparing((Booking booking) -> placedAt(booking))
            .thenComparing(Booking::getId))
        .toList();
    Map<String, Long> nextSequenceByDate = existingMaxSequences(bookings);
    int migrated = 0;

    for (Booking booking : bookings) {
      if (isFormattedOrderNumber(booking.getBookingNumber())) {
        continue;
      }
      LocalDateTime placedAt = placedAt(booking);
      String dateCode = placedAt.format(DATE_CODE);
      long sequence = nextSequenceByDate.getOrDefault(dateCode, 0L) + 1;
      String bookingNumber = BusinessIdFormatter.orderNumber(placedAt, sequence);
      while (bookingRepository.existsByBookingNumber(bookingNumber)) {
        sequence += 1;
        bookingNumber = BusinessIdFormatter.orderNumber(placedAt, sequence);
      }
      booking.setBookingNumber(bookingNumber);
      nextSequenceByDate.put(dateCode, sequence);
      migrated += 1;
    }

    if (migrated > 0) {
      log.info("Migrated {} old booking IDs to ORD-YYMMDD-XX format", migrated);
    }
  }

  private Map<String, Long> existingMaxSequences(List<Booking> bookings) {
    Map<String, Long> sequences = new HashMap<>();
    for (Booking booking : bookings) {
      String bookingNumber = booking.getBookingNumber();
      if (bookingNumber == null) {
        continue;
      }
      Matcher matcher = ORDER_PATTERN.matcher(bookingNumber);
      if (matcher.matches()) {
        String dateCode = matcher.group(1);
        long sequence = Long.parseLong(matcher.group(2));
        sequences.merge(dateCode, sequence, Math::max);
      }
    }
    return sequences;
  }

  private boolean isFormattedOrderNumber(String bookingNumber) {
    return bookingNumber != null && ORDER_PATTERN.matcher(bookingNumber).matches();
  }

  private LocalDateTime placedAt(Booking booking) {
    if (booking.getCreatedAt() != null) {
      return booking.getCreatedAt();
    }
    return booking.getRentalStartDate().atTime(LocalTime.NOON);
  }
}
