package com.clickkaar.controller;

import com.clickkaar.dto.admin.EmployeeRequest;
import com.clickkaar.dto.admin.EmployeeResponse;
import com.clickkaar.entity.Role;
import com.clickkaar.entity.User;
import com.clickkaar.enums.RoleName;
import com.clickkaar.exception.BadRequestException;
import com.clickkaar.repository.BookingRepository;
import com.clickkaar.repository.PaymentRepository;
import com.clickkaar.repository.ProductRepository;
import com.clickkaar.repository.RoleRepository;
import com.clickkaar.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {
  private final BookingRepository bookingRepository;
  private final ProductRepository productRepository;
  private final PaymentRepository paymentRepository;
  private final UserRepository userRepository;
  private final RoleRepository roleRepository;
  private final PasswordEncoder passwordEncoder;

  @GetMapping("/dashboard")
  public Map<String, Object> dashboard() {
    YearMonth month = YearMonth.now();
    return Map.of(
        "month", month.toString(),
        "totalBookingsThisMonth", bookingRepository.count(),
        "revenueThisMonth", paymentRepository.findAll().stream()
            .map(payment -> payment.getAmount() == null ? BigDecimal.ZERO : payment.getAmount())
            .reduce(BigDecimal.ZERO, BigDecimal::add),
        "itemsInCatalogue", productRepository.count(),
        "overdueReturns", 0
    );
  }

  @PostMapping("/employees")
  @ResponseStatus(HttpStatus.CREATED)
  public EmployeeResponse createEmployee(@Valid @RequestBody EmployeeRequest request) {
    if (userRepository.existsByEmail(request.email())) {
      throw new BadRequestException("Email is already registered");
    }
    if (userRepository.existsByMobile(request.mobile())) {
      throw new BadRequestException("Mobile is already registered");
    }

    Role employeeRole = roleRepository.findByName(RoleName.EMPLOYEE)
        .orElseThrow(() -> new BadRequestException("Employee role is not configured"));

    User employee = User.builder()
        .fullName(request.fullName())
        .email(request.email().toLowerCase())
        .mobile(request.mobile())
        .password(passwordEncoder.encode(request.password()))
        .enabled(true)
        .mobileVerified(false)
        .roles(Set.of(employeeRole))
        .build();

    User saved = userRepository.save(employee);
    Set<String> roles = saved.getRoles().stream().map(role -> role.getName().name()).collect(Collectors.toSet());
    return new EmployeeResponse(saved.getId(), saved.getFullName(), saved.getEmail(), saved.getMobile(), roles);
  }
}
