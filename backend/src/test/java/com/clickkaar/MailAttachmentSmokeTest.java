package com.clickkaar;

import com.clickkaar.entity.Booking;
import com.clickkaar.entity.BookingItem;
import com.clickkaar.entity.Product;
import com.clickkaar.entity.User;
import com.clickkaar.enums.PaymentStatus;
import com.clickkaar.service.BookingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;

@SpringBootTest
@ActiveProfiles("local")
class MailAttachmentSmokeTest {
  @Autowired
  private BookingService bookingService;

  @Test
  void sendsBookingEmailWithInvoiceAndTermsAttachments() {
    Booking booking = sampleBooking();
    bookingService.sendBookingBillEmail(booking, PaymentStatus.PENDING, "Mail smoke test");
  }

  private Booking sampleBooking() {
    Product product = Product.builder()
        .id(1L)
        .name("Canon EOS R5 Cinema Kit")
        .dailyPrice(new BigDecimal("4200"))
        .build();
    User customer = User.builder()
        .id(999L)
        .fullName("Jeet Khadse")
        .email("jeet.khadse007@gmail.com")
        .mobile("9096820033")
        .build();
    Booking booking = Booking.builder()
        .id(999L)
        .bookingNumber("CK-TEST-" + System.currentTimeMillis())
        .customer(customer)
        .rentalStartDate(LocalDate.now().plusDays(2))
        .rentalEndDate(LocalDate.now().plusDays(4))
        .rentalDays(3)
        .totalAmount(new BigDecimal("16380.00"))
        .build();
    booking.getItems().add(BookingItem.builder()
        .booking(booking)
        .product(product)
        .dailyPrice(product.getDailyPrice())
        .lineTotal(new BigDecimal("12600.00"))
        .build());
    return booking;
  }
}
