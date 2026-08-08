package com.clickkaar.service;

import com.clickkaar.entity.Booking;
import com.clickkaar.entity.BookingItem;
import com.clickkaar.enums.PaymentStatus;
import com.clickkaar.util.BusinessIdFormatter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class PdfDocumentService {
  private static final DateTimeFormatter DISPLAY_DATE = DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH);
  private static final int PAGE_WIDTH = 595;
  private static final int PAGE_HEIGHT = 842;

  public byte[] invoicePdf(Booking booking, PaymentStatus paymentStatus, String paymentMethod) {
    List<PdfLine> lines = new ArrayList<>();
    int y = 792;
    add(lines, "CLICK-KAAR LLP", 56, y, 18);
    y -= 30;
    add(lines, "Invoice No: " + BusinessIdFormatter.invoiceNumber(booking), 56, y, 10);
    add(lines, "Invoice Date: " + LocalDate.now().format(DISPLAY_DATE), 350, y, 10);
    y -= 24;
    add(lines, "Customer Name: " + safe(booking.getCustomer().getFullName()), 56, y, 10);
    add(lines, "Phone: " + safe(booking.getCustomer().getMobile()), 350, y, 10);
    y -= 18;
    add(lines, "Email: " + safe(booking.getCustomer().getEmail()), 56, y, 10);
    add(lines, "Rental Period: " + rentalPeriod(booking), 350, y, 10);
    y -= 36;

    add(lines, "Item", 56, y, 10);
    add(lines, "Qty", 270, y, 10);
    add(lines, "Days", 320, y, 10);
    add(lines, "Rate/Day", 375, y, 10);
    add(lines, "Amount", 470, y, 10);
    y -= 16;

    BigDecimal rentalSubtotal = BigDecimal.ZERO;
    for (InvoiceLine item : invoiceLines(booking)) {
      BigDecimal amount = item.rate().multiply(BigDecimal.valueOf(item.quantity())).multiply(BigDecimal.valueOf(booking.getRentalDays()));
      rentalSubtotal = rentalSubtotal.add(amount);
      add(lines, truncate(item.name(), 34), 56, y, 9);
      add(lines, String.valueOf(item.quantity()), 270, y, 9);
      add(lines, String.valueOf(booking.getRentalDays()), 320, y, 9);
      add(lines, money(item.rate()), 375, y, 9);
      add(lines, money(amount), 470, y, 9);
      y -= 16;
      if (y < 210) {
        y = 210;
        break;
      }
    }

    BigDecimal securityDeposit = rentalSubtotal.multiply(BigDecimal.valueOf(0.3)).setScale(0, RoundingMode.HALF_UP);
    BigDecimal grossTotal = rentalSubtotal.add(securityDeposit);
    BigDecimal discount = grossTotal.subtract(booking.getTotalAmount()).max(BigDecimal.ZERO);
    y = Math.min(y - 18, 420);
    add(lines, "Security Deposit", 350, y, 10);
    add(lines, money(securityDeposit), 470, y, 10);
    y -= 18;
    add(lines, "Subtotal", 350, y, 10);
    add(lines, money(rentalSubtotal), 470, y, 10);
    if (discount.signum() > 0) {
      y -= 18;
      add(lines, "Discount", 350, y, 10);
      add(lines, "-" + money(discount), 470, y, 10);
    }
    y -= 18;
    add(lines, "Grand Total", 350, y, 12);
    add(lines, money(booking.getTotalAmount()), 470, y, 12);

    y -= 36;
    add(lines, "Payment Status: " + (paymentStatus == PaymentStatus.PAID ? "PAID" : "UNPAID"), 56, y, 10);
    y -= 16;
    add(lines, "Payment Method: " + paymentMethod, 56, y, 10);
    y -= 32;
    add(lines, "Terms", 56, y, 11);
    y -= 18;
    add(lines, "- Security deposit is refundable after inspection.", 56, y, 9);
    y -= 14;
    add(lines, "- Customer is responsible for damage, loss, or missing accessories.", 56, y, 9);

    return writePdf(lines);
  }

  public byte[] termsPdf(String termsAndConditions) {
    List<PdfLine> lines = new ArrayList<>();
    int y = 792;
    int page = 0;
    add(lines, "CLICK-KAAR TERMS & CONDITIONS", 56, y, 16, page);
    y -= 28;
    for (String paragraph : termsAndConditions.split("\\R")) {
      if (paragraph.isBlank()) {
        y -= 10;
        continue;
      }
      for (String line : wrap(paragraph.trim(), 88)) {
        if (y < 56) {
          page += 1;
          y = 792;
        }
        add(lines, line, 56, y, 9, page);
        y -= 14;
      }
    }
    return writePdf(lines);
  }

  private List<InvoiceLine> invoiceLines(Booking booking) {
    Map<String, InvoiceLine> lines = new LinkedHashMap<>();
    for (BookingItem item : booking.getItems()) {
      String key = item.getProduct().getId() + ":" + item.getDailyPrice();
      InvoiceLine current = lines.get(key);
      if (current == null) {
        lines.put(key, new InvoiceLine(item.getProduct().getName(), 1, item.getDailyPrice()));
      } else {
        lines.put(key, new InvoiceLine(current.name(), current.quantity() + 1, current.rate()));
      }
    }
    return List.copyOf(lines.values());
  }

  private byte[] writePdf(List<PdfLine> allLines) {
    List<List<PdfLine>> pages = paginate(allLines);
    List<String> objects = new ArrayList<>();
    StringBuilder kids = new StringBuilder();

    objects.add("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
    objects.add("");
    objects.add("3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");

    int nextObject = 4;
    for (List<PdfLine> pageLines : pages) {
      int pageObject = nextObject++;
      int contentObject = nextObject++;
      kids.append(pageObject).append(" 0 R ");
      String stream = contentStream(pageLines);
      objects.add(pageObject + " 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + PAGE_WIDTH + " " + PAGE_HEIGHT + "] /Resources << /Font << /F1 3 0 R >> >> /Contents " + contentObject + " 0 R >>\nendobj\n");
      objects.add(contentObject + " 0 obj\n<< /Length " + stream.getBytes(StandardCharsets.ISO_8859_1).length + " >>\nstream\n" + stream + "\nendstream\nendobj\n");
    }
    objects.set(1, "2 0 obj\n<< /Type /Pages /Kids [" + kids + "] /Count " + pages.size() + " >>\nendobj\n");

    ByteArrayOutputStream output = new ByteArrayOutputStream();
    write(output, "%PDF-1.4\n");
    List<Integer> offsets = new ArrayList<>();
    for (String object : objects) {
      offsets.add(output.size());
      write(output, object);
    }
    int xrefOffset = output.size();
    write(output, "xref\n0 " + (objects.size() + 1) + "\n0000000000 65535 f \n");
    for (Integer offset : offsets) {
      write(output, String.format(Locale.ROOT, "%010d 00000 n \n", offset));
    }
    write(output, "trailer\n<< /Size " + (objects.size() + 1) + " /Root 1 0 R >>\nstartxref\n" + xrefOffset + "\n%%EOF\n");
    return output.toByteArray();
  }

  private List<List<PdfLine>> paginate(List<PdfLine> lines) {
    List<List<PdfLine>> pages = new ArrayList<>();
    for (PdfLine line : lines) {
      while (pages.size() <= line.page()) {
        pages.add(new ArrayList<>());
      }
      pages.get(line.page()).add(line);
    }
    return pages;
  }

  private String contentStream(List<PdfLine> lines) {
    StringBuilder stream = new StringBuilder("BT\n");
    for (PdfLine line : lines) {
      stream.append("/F1 ").append(line.size()).append(" Tf ")
          .append("1 0 0 1 ").append(line.x()).append(' ').append(line.y()).append(" Tm (")
          .append(escape(line.text())).append(") Tj\n");
    }
    stream.append("ET");
    return stream.toString();
  }

  private void add(List<PdfLine> lines, String text, int x, int y, int size) {
    add(lines, text, x, y, size, 0);
  }

  private void add(List<PdfLine> lines, String text, int x, int y, int size, int page) {
    lines.add(new PdfLine(toPdfText(text), x, y, size, page));
  }

  private List<String> wrap(String text, int maxLength) {
    List<String> lines = new ArrayList<>();
    StringBuilder line = new StringBuilder();
    for (String word : text.split("\\s+")) {
      if (line.length() + word.length() + 1 > maxLength) {
        lines.add(line.toString());
        line = new StringBuilder();
      }
      if (!line.isEmpty()) {
        line.append(' ');
      }
      line.append(word);
    }
    if (!line.isEmpty()) {
      lines.add(line.toString());
    }
    return lines;
  }

  private String rentalPeriod(Booking booking) {
    return booking.getRentalStartDate().format(DISPLAY_DATE) + " - " + booking.getRentalEndDate().format(DISPLAY_DATE);
  }

  private String money(BigDecimal value) {
    return "Rs. " + value.setScale(2, RoundingMode.HALF_UP).toPlainString();
  }

  private String safe(String value) {
    return value == null || value.isBlank() ? "-" : value.trim();
  }

  private String truncate(String value, int maxLength) {
    String safeValue = safe(value);
    return safeValue.length() <= maxLength ? safeValue : safeValue.substring(0, maxLength - 3) + "...";
  }

  private String toPdfText(String value) {
    return safe(value)
        .replace("\u20b9", "Rs.")
        .replace("\u2022", "-")
        .replaceAll("[^\\x20-\\x7E]", "-");
  }

  private String escape(String value) {
    return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)");
  }

  private void write(ByteArrayOutputStream output, String value) {
    output.writeBytes(value.getBytes(StandardCharsets.ISO_8859_1));
  }

  private record PdfLine(String text, int x, int y, int size, int page) {}
  private record InvoiceLine(String name, int quantity, BigDecimal rate) {}
}
