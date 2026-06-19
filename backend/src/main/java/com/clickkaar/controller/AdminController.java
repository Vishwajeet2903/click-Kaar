package com.clickkaar.controller;

import com.clickkaar.dto.admin.EmployeeRequest;
import com.clickkaar.dto.admin.EmployeeResponse;
import com.clickkaar.dto.admin.CustomerVerificationResponse;
import com.clickkaar.dto.admin.RegistrationDocumentResponse;
import com.clickkaar.entity.PendingRegistration;
import com.clickkaar.entity.Role;
import com.clickkaar.entity.User;
import com.clickkaar.enums.RoleName;
import com.clickkaar.exception.BadRequestException;
import com.clickkaar.repository.BookingRepository;
import com.clickkaar.repository.PendingRegistrationRepository;
import com.clickkaar.repository.PaymentRepository;
import com.clickkaar.repository.ProductRepository;
import com.clickkaar.repository.RoleRepository;
import com.clickkaar.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
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
  private final PendingRegistrationRepository pendingRegistrationRepository;
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

  @GetMapping("/customers/pending")
  public List<CustomerVerificationResponse> pendingCustomers() {
    return pendingRegistrationRepository.findAll().stream()
        .map(this::customerVerificationResponse)
        .toList();
  }

  @GetMapping("/customers/{requestId}/documents/{documentType}")
  public ResponseEntity<Resource> pendingCustomerDocument(@PathVariable Long requestId, @PathVariable String documentType) {
    PendingRegistration pendingRegistration = pendingRegistrationRepository.findById(requestId)
        .orElseThrow(() -> new BadRequestException("Pending registration not found"));
    String documentName = documentNameForType(pendingRegistration, documentType);
    if (documentName == null || documentName.isBlank()) {
      throw new BadRequestException("Registration document not found");
    }

    Path documentPath = Path.of(documentName).normalize();
    Path uploadRoot = Path.of("uploads", "registration-documents").toAbsolutePath().normalize();
    Path absoluteDocumentPath = documentPath.toAbsolutePath().normalize();
    if (!absoluteDocumentPath.startsWith(uploadRoot) || !Files.exists(absoluteDocumentPath)) {
      throw new BadRequestException("Registration document not found");
    }

    try {
      Resource resource = new UrlResource(absoluteDocumentPath.toUri());
      String contentType = Files.probeContentType(absoluteDocumentPath);
      MediaType mediaType = contentType == null ? MediaType.APPLICATION_OCTET_STREAM : MediaType.parseMediaType(contentType);
      return ResponseEntity.ok()
          .contentType(mediaType)
          .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + absoluteDocumentPath.getFileName() + "\"")
          .body(resource);
    } catch (MalformedURLException exception) {
      throw new BadRequestException("Unable to read registration document");
    } catch (Exception exception) {
      throw new BadRequestException("Unable to read registration document");
    }
  }

  @PatchMapping("/customers/{requestId}/verify")
  @Transactional
  public CustomerVerificationResponse verifyCustomer(@PathVariable Long requestId) {
    PendingRegistration pendingRegistration = pendingRegistrationRepository.findById(requestId)
        .orElseThrow(() -> new BadRequestException("Pending registration not found"));
    if (userRepository.existsByEmail(pendingRegistration.getEmail())) {
      throw new BadRequestException("Email is already registered");
    }
    if (pendingRegistration.getMobile() != null && userRepository.existsByMobile(pendingRegistration.getMobile())) {
      throw new BadRequestException("Mobile is already registered");
    }

    Role customerRole = roleRepository.findByName(RoleName.CUSTOMER)
        .orElseThrow(() -> new BadRequestException("Customer role is not configured"));

    User customer = User.builder()
        .fullName(pendingRegistration.getFullName())
        .firstName(pendingRegistration.getFirstName())
        .lastName(pendingRegistration.getLastName())
        .email(pendingRegistration.getEmail())
        .mobile(pendingRegistration.getMobile())
        .gender(pendingRegistration.getGender())
        .dob(pendingRegistration.getDob())
        .alternateContactNumber(pendingRegistration.getAlternateContactNumber())
        .currentAddress(pendingRegistration.getCurrentAddress())
        .city(pendingRegistration.getCity())
        .state(pendingRegistration.getState())
        .pincode(pendingRegistration.getPincode())
        .country(pendingRegistration.getCountry())
        .residenceType(pendingRegistration.getResidenceType())
        .occupation(pendingRegistration.getOccupation())
        .companyName(pendingRegistration.getCompanyName())
        .socialMediaProfile(pendingRegistration.getSocialMediaProfile())
        .photoDocumentName(pendingRegistration.getPhotoDocumentName())
        .drivingLicenseDocumentName(pendingRegistration.getDrivingLicenseDocumentName())
        .electricityBillDocumentName(pendingRegistration.getElectricityBillDocumentName())
        .rentAgreementDocumentName(pendingRegistration.getRentAgreementDocumentName())
        .companyBonafideLetterDocumentName(pendingRegistration.getCompanyBonafideLetterDocumentName())
        .password(pendingRegistration.getPassword())
        .enabled(true)
        .mobileVerified(false)
        .roles(Set.of(customerRole))
        .build();

    userRepository.save(customer);
    CustomerVerificationResponse response = customerVerificationResponse(pendingRegistration);
    pendingRegistrationRepository.delete(pendingRegistration);
    return new CustomerVerificationResponse(
        response.requestId(),
        response.fullName(),
        response.firstName(),
        response.lastName(),
        response.email(),
        response.mobile(),
        response.gender(),
        response.dob(),
        response.alternateContactNumber(),
        response.currentAddress(),
        response.city(),
        response.state(),
        response.pincode(),
        response.country(),
        response.residenceType(),
        response.occupation(),
        response.companyName(),
        response.socialMediaProfile(),
        "VERIFIED",
        response.documents()
    );
  }

  private CustomerVerificationResponse customerVerificationResponse(PendingRegistration pendingRegistration) {
    return new CustomerVerificationResponse(
        pendingRegistration.getId(),
        pendingRegistration.getFullName(),
        pendingRegistration.getFirstName(),
        pendingRegistration.getLastName(),
        pendingRegistration.getEmail(),
        pendingRegistration.getMobile(),
        pendingRegistration.getGender(),
        pendingRegistration.getDob(),
        pendingRegistration.getAlternateContactNumber(),
        pendingRegistration.getCurrentAddress(),
        pendingRegistration.getCity(),
        pendingRegistration.getState(),
        pendingRegistration.getPincode(),
        pendingRegistration.getCountry(),
        pendingRegistration.getResidenceType(),
        pendingRegistration.getOccupation(),
        pendingRegistration.getCompanyName(),
        pendingRegistration.getSocialMediaProfile(),
        "PENDING_VERIFICATION",
        documentsFor(pendingRegistration)
    );
  }

  private List<RegistrationDocumentResponse> documentsFor(PendingRegistration pendingRegistration) {
    List<RegistrationDocumentResponse> documents = new ArrayList<>();
    addDocument(documents, "photo", "Photo", pendingRegistration.getPhotoDocumentName());
    addDocument(documents, "drivingLicense", "Driving license", pendingRegistration.getDrivingLicenseDocumentName());
    addDocument(documents, "electricityBill", "Electricity bill", pendingRegistration.getElectricityBillDocumentName());
    addDocument(documents, "rentAgreement", "Rent agreement", pendingRegistration.getRentAgreementDocumentName());
    addDocument(documents, "companyBonafideLetter", "Company bonafide letter", pendingRegistration.getCompanyBonafideLetterDocumentName());
    return documents;
  }

  private void addDocument(List<RegistrationDocumentResponse> documents, String type, String label, String documentName) {
    if (documentName != null && !documentName.isBlank()) {
      documents.add(new RegistrationDocumentResponse(type, label, Path.of(documentName).getFileName().toString()));
    }
  }

  private String documentNameForType(PendingRegistration pendingRegistration, String documentType) {
    return switch (documentType) {
      case "photo" -> pendingRegistration.getPhotoDocumentName();
      case "drivingLicense" -> pendingRegistration.getDrivingLicenseDocumentName();
      case "electricityBill" -> pendingRegistration.getElectricityBillDocumentName();
      case "rentAgreement" -> pendingRegistration.getRentAgreementDocumentName();
      case "companyBonafideLetter" -> pendingRegistration.getCompanyBonafideLetterDocumentName();
      default -> null;
    };
  }
}
