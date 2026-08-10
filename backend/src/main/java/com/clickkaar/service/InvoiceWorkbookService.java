package com.clickkaar.service;

import com.clickkaar.entity.Booking;
import com.clickkaar.entity.BookingItem;
import com.clickkaar.entity.Product;
import com.clickkaar.entity.User;
import com.clickkaar.util.BusinessIdFormatter;
import jakarta.persistence.EntityNotFoundException;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class InvoiceWorkbookService {
  private static final String TEMPLATE_PATH = "Click-Kaar_Auto_Invoice_Template.xlsx";
  private static final DateTimeFormatter DISPLAY_DATE = DateTimeFormatter.ofPattern("dd-MMM-yyyy");
  private static final int FIRST_ITEM_ROW = 14;
  private static final int MAX_ITEM_ROWS = 5;

  public byte[] invoiceWorkbook(Booking booking) {
    try (InputStream input = new ClassPathResource(TEMPLATE_PATH).getInputStream();
         Workbook workbook = new XSSFWorkbook(input);
         ByteArrayOutputStream output = new ByteArrayOutputStream()) {
      Sheet sheet = workbook.getSheetAt(0);
      fillHeader(sheet, booking);
      fillCustomer(sheet, booking.getCustomer());
      fillItems(sheet, booking);
      workbook.setForceFormulaRecalculation(true);
      workbook.getCreationHelper().createFormulaEvaluator().evaluateAll();
      workbook.write(output);
      return output.toByteArray();
    } catch (IOException exception) {
      throw new IllegalStateException("Unable to create invoice workbook", exception);
    }
  }

  private void fillHeader(Sheet sheet, Booking booking) {
    setString(sheet, "G5", BusinessIdFormatter.invoiceNumber(booking));
    setString(sheet, "G6", LocalDate.now().format(DISPLAY_DATE));
    setString(sheet, "G7", safe(booking.getBookingNumber()));
  }

  private void fillCustomer(Sheet sheet, User customer) {
    setString(sheet, "C10", safe(customer.getFullName()));
    setString(sheet, "C11", contact(customer));
    setString(sheet, "C12", idProof(customer));
    setString(sheet, "C13", BusinessIdFormatter.customerNumber(customer));
  }

  private void fillItems(Sheet sheet, Booking booking) {
    setString(sheet, "G10", booking.getRentalStartDate().format(DISPLAY_DATE));
    setString(sheet, "G11", booking.getRentalEndDate().format(DISPLAY_DATE));

    List<InvoiceLine> lines = invoiceLines(booking);
    List<InvoiceLine> visibleLines = visibleInvoiceLines(lines, booking.getRentalDays());
    for (int index = 0; index < MAX_ITEM_ROWS; index += 1) {
      int rowIndex = FIRST_ITEM_ROW + index;
      if (index < visibleLines.size()) {
        InvoiceLine line = visibleLines.get(index);
        setNumber(sheet, rowIndex, 0, index + 1);
        setString(sheet, rowIndex, 1, line.productCode());
        setString(sheet, rowIndex, 2, line.description());
        setString(sheet, rowIndex, 3, line.category());
        setNumber(sheet, rowIndex, 4, line.dailyRate().doubleValue());
        setNumber(sheet, rowIndex, 5, line.days());
        setFormula(sheet, rowIndex, 6, "E" + (rowIndex + 1) + "*F" + (rowIndex + 1));
      } else {
        clearItemRow(sheet, rowIndex);
      }
    }

    BigDecimal rentalSubtotal = lines.stream()
        .map(InvoiceLine::lineTotal)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
    BigDecimal securityDeposit = rentalSubtotal.multiply(BigDecimal.valueOf(0.3)).setScale(0, RoundingMode.HALF_UP);
    setNumber(sheet, "G24", securityDeposit.doubleValue());
  }

  private List<InvoiceLine> visibleInvoiceLines(List<InvoiceLine> lines, int rentalDays) {
    if (lines.size() <= MAX_ITEM_ROWS) {
      return lines;
    }

    List<InvoiceLine> visible = new ArrayList<>(lines.subList(0, MAX_ITEM_ROWS - 1));
    BigDecimal remainingTotal = lines.subList(MAX_ITEM_ROWS - 1, lines.size()).stream()
        .map(InvoiceLine::lineTotal)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
    BigDecimal displayRate = rentalDays <= 0
        ? remainingTotal
        : remainingTotal.divide(BigDecimal.valueOf(rentalDays), 2, RoundingMode.HALF_UP);
    visible.add(new InvoiceLine("Additional items", "Additional equipment items", "Mixed", displayRate, Math.max(1, rentalDays)));
    return visible;
  }

  private List<InvoiceLine> invoiceLines(Booking booking) {
    Map<String, InvoiceLine> grouped = new LinkedHashMap<>();
    for (BookingItem item : booking.getItems()) {
      Product product = product(item);
      BigDecimal dailyRate = item.getDailyPrice() == null ? BigDecimal.ZERO : item.getDailyPrice();
      String key = productId(product) + ":" + dailyRate;
      InvoiceLine current = grouped.get(key);
      BigDecimal lineTotal = item.getLineTotal() == null
          ? dailyRate.multiply(BigDecimal.valueOf(Math.max(1, booking.getRentalDays())))
          : item.getLineTotal();
      if (current == null) {
        grouped.put(key, new InvoiceLine(
            productCode(product),
            productName(product),
            categoryName(product),
            dailyRate,
            Math.max(1, booking.getRentalDays()),
            lineTotal
        ));
      } else {
        grouped.put(key, current.add(lineTotal));
      }
    }
    return List.copyOf(grouped.values());
  }

  private Product product(BookingItem item) {
    try {
      return item.getProduct();
    } catch (EntityNotFoundException exception) {
      return null;
    }
  }

  private String productCode(Product product) {
    Long id = productId(product);
    return id == null ? "PROD-0000" : "PROD-" + String.format("%04d", id);
  }

  private Long productId(Product product) {
    return product == null ? null : product.getId();
  }

  private String productName(Product product) {
    return product == null ? "Unavailable product" : safe(product.getName());
  }

  private String categoryName(Product product) {
    if (product == null || product.getCategory() == null) {
      return "-";
    }
    String displayName = product.getCategory().getDisplayName();
    if (displayName != null && !displayName.isBlank()) {
      return displayName.trim();
    }
    return product.getCategory().getName() == null ? "-" : product.getCategory().getName().name();
  }

  private String contact(User customer) {
    String mobile = safe(customer.getMobile());
    String email = safe(customer.getEmail());
    if (mobile.equals("-")) {
      return email;
    }
    if (email.equals("-")) {
      return mobile;
    }
    return mobile + " / " + email;
  }

  private String idProof(User customer) {
    if (hasText(customer.getDrivingLicenseDocumentName())) {
      return customer.getDrivingLicenseDocumentName().trim();
    }
    if (hasText(customer.getPhotoDocumentName())) {
      return customer.getPhotoDocumentName().trim();
    }
    return "-";
  }

  private void clearItemRow(Sheet sheet, int rowIndex) {
    for (int column = 0; column <= 6; column += 1) {
      cell(sheet, rowIndex, column).setBlank();
    }
  }

  private void setString(Sheet sheet, String address, String value) {
    cell(sheet, address).setCellValue(value);
  }

  private void setNumber(Sheet sheet, String address, double value) {
    cell(sheet, address).setCellValue(value);
  }

  private void setNumber(Sheet sheet, int rowIndex, int columnIndex, double value) {
    cell(sheet, rowIndex, columnIndex).setCellValue(value);
  }

  private void setString(Sheet sheet, int rowIndex, int columnIndex, String value) {
    cell(sheet, rowIndex, columnIndex).setCellValue(value);
  }

  private void setFormula(Sheet sheet, int rowIndex, int columnIndex, String formula) {
    cell(sheet, rowIndex, columnIndex).setCellFormula(formula);
  }

  private Cell cell(Sheet sheet, String address) {
    int rowIndex = Integer.parseInt(address.replaceAll("\\D", "")) - 1;
    int columnIndex = org.apache.poi.ss.util.CellReference.convertColStringToIndex(address.replaceAll("\\d", ""));
    return cell(sheet, rowIndex, columnIndex);
  }

  private Cell cell(Sheet sheet, int rowIndex, int columnIndex) {
    Row row = sheet.getRow(rowIndex);
    if (row == null) {
      row = sheet.createRow(rowIndex);
    }
    return row.getCell(columnIndex, Row.MissingCellPolicy.CREATE_NULL_AS_BLANK);
  }

  private String safe(String value) {
    return value == null || value.isBlank() ? "-" : value.trim();
  }

  private boolean hasText(String value) {
    return value != null && !value.isBlank();
  }

  private record InvoiceLine(String productCode, String description, String category, BigDecimal dailyRate, int days, BigDecimal lineTotal) {
    private InvoiceLine(String productCode, String description, String category, BigDecimal dailyRate, int days) {
      this(productCode, description, category, dailyRate, days, dailyRate.multiply(BigDecimal.valueOf(days)));
    }

    private InvoiceLine add(BigDecimal additionalLineTotal) {
      BigDecimal newTotal = lineTotal.add(additionalLineTotal);
      BigDecimal newRate = days <= 0 ? newTotal : newTotal.divide(BigDecimal.valueOf(days), 2, RoundingMode.HALF_UP);
      return new InvoiceLine(productCode, description, category, newRate, days, newTotal);
    }
  }
}
