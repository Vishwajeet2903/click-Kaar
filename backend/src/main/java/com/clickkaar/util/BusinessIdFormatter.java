package com.clickkaar.util;

import com.clickkaar.entity.Booking;
import com.clickkaar.entity.Payment;
import com.clickkaar.entity.User;
import com.clickkaar.enums.PaymentStatus;
import com.clickkaar.enums.PaymentType;
import com.clickkaar.enums.RoleName;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public final class BusinessIdFormatter {
  private static final DateTimeFormatter DATE_CODE = DateTimeFormatter.ofPattern("yyMMdd");

  private BusinessIdFormatter() {
  }

  public static String orderNumber(LocalDateTime placedAt, long dailySequence) {
    return "ORD-" + placedAt.format(DATE_CODE) + "-" + String.format("%02d", dailySequence);
  }

  public static String paymentNumber(Payment payment) {
    return "PAY-" + compactOrderNumber(payment.getBooking()) + "-" + paymentTypeCode(payment);
  }

  public static String invoiceNumber(Booking booking) {
    return "INV-" + compactOrderNumber(booking);
  }

  public static String customerNumber(User customer) {
    LocalDateTime createdAt = customer.getCreatedAt() == null ? LocalDateTime.now() : customer.getCreatedAt();
    return customerTypeCode(customer) + "-" + createdAt.format(DateTimeFormatter.ofPattern("yy")) + "-" + String.format("%04d", 1000 + customer.getId());
  }

  private static String compactOrderNumber(Booking booking) {
    String bookingNumber = booking.getBookingNumber() == null ? "" : booking.getBookingNumber();
    if (bookingNumber.startsWith("ORD-")) {
      return bookingNumber.substring(4);
    }
    return bookingNumber.replaceFirst("^[A-Za-z]+-", "");
  }

  private static String paymentTypeCode(Payment payment) {
    if (payment.getStatus() == PaymentStatus.REFUNDED) {
      return "REF";
    }
    return payment.getType() == PaymentType.SECURITY_DEPOSIT ? "DEP" : "FIN";
  }

  private static String customerTypeCode(User customer) {
    String company = customer.getCompanyName() == null ? "" : customer.getCompanyName().trim();
    boolean customerRole = customer.getRoles() != null && customer.getRoles().stream().anyMatch(role -> role.getName() == RoleName.CUSTOMER);
    if (!company.isBlank() && customerRole) {
      return "PRO";
    }
    return "CRE";
  }
}
