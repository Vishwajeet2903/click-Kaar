package com.clickkaar.service;

import com.clickkaar.dto.auth.*;
import com.clickkaar.entity.OTP;
import com.clickkaar.entity.Role;
import com.clickkaar.entity.User;
import com.clickkaar.enums.OtpPurpose;
import com.clickkaar.enums.RoleName;
import com.clickkaar.exception.BadRequestException;
import com.clickkaar.repository.OtpRepository;
import com.clickkaar.repository.RoleRepository;
import com.clickkaar.repository.UserRepository;
import com.clickkaar.security.CustomUserDetails;
import com.clickkaar.security.JwtService;
import com.clickkaar.util.OtpGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {
  private final UserRepository userRepository;
  private final RoleRepository roleRepository;
  private final OtpRepository otpRepository;
  private final PasswordEncoder passwordEncoder;
  private final AuthenticationManager authenticationManager;
  private final JwtService jwtService;
  private final OtpGenerator otpGenerator;

  @Transactional
  public AuthResponse register(RegisterRequest request) {
    if (userRepository.existsByEmail(request.email())) {
      throw new BadRequestException("Email is already registered");
    }
    if (request.mobile() != null && userRepository.existsByMobile(request.mobile())) {
      throw new BadRequestException("Mobile is already registered");
    }

    Role customerRole = roleRepository.findByName(RoleName.CUSTOMER)
        .orElseThrow(() -> new BadRequestException("Customer role is not configured"));

    User user = User.builder()
        .fullName(request.fullName())
        .firstName(request.firstName())
        .lastName(request.lastName())
        .email(request.email().toLowerCase())
        .mobile(request.mobile())
        .gender(request.gender())
        .dob(request.dob())
        .alternateContactNumber(request.alternateContactNumber())
        .currentAddress(request.currentAddress())
        .city(request.city())
        .state(request.state())
        .pincode(request.pincode())
        .country(request.country())
        .residenceType(request.residenceType())
        .occupation(request.occupation())
        .companyName(request.companyName())
        .socialMediaProfile(request.socialMediaProfile())
        .photoDocumentName(saveDocument(request.photo()))
        .drivingLicenseDocumentName(saveDocument(request.drivingLicense()))
        .electricityBillDocumentName(saveDocument(request.electricityBill()))
        .rentAgreementDocumentName(saveDocument(request.rentAgreement()))
        .password(passwordEncoder.encode(request.password()))
        .enabled(true)
        .mobileVerified(false)
        .roles(Set.of(customerRole))
        .build();

    userRepository.save(user);
    return authResponse(user);
  }

  public AuthResponse login(LoginRequest request) {
    authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(request.email(), request.password()));
    User user = userRepository.findByEmail(request.email())
        .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
    return authResponse(user);
  }

  public AuthResponse adminLogin(LoginRequest request) {
    AuthResponse response = login(request);
    if (!response.roles().contains("ADMIN")) {
      throw new BadCredentialsException("Admin access required");
    }
    return response;
  }

  @Transactional
  public String requestMobileOtp(OtpRequest request) {
    String code = otpGenerator.generate();
    otpRepository.save(OTP.builder()
        .mobile(request.mobile())
        .code(code)
        .purpose(OtpPurpose.MOBILE_VERIFICATION)
        .expiresAt(LocalDateTime.now().plusMinutes(10))
        .used(false)
        .build());
    return "OTP generated for development. Integrate SMS provider before production.";
  }

  @Transactional
  public String verifyMobileOtp(VerifyOtpRequest request) {
    OTP otp = otpRepository.findTopByMobileAndPurposeAndUsedFalseOrderByCreatedAtDesc(request.mobile(), OtpPurpose.MOBILE_VERIFICATION)
        .orElseThrow(() -> new BadRequestException("OTP not found"));
    if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
      throw new BadRequestException("OTP expired");
    }
    if (!otp.getCode().equals(request.code())) {
      throw new BadRequestException("Invalid OTP");
    }
    otp.setUsed(true);
    userRepository.findAll().stream()
        .filter(user -> request.mobile().equals(user.getMobile()))
        .findFirst()
        .ifPresent(user -> {
          user.setMobileVerified(true);
          userRepository.save(user);
        });
    return "Mobile verified successfully";
  }

  private AuthResponse authResponse(User user) {
    String token = jwtService.generateToken(new CustomUserDetails(user));
    Set<String> roles = user.getRoles().stream().map(role -> role.getName().name()).collect(Collectors.toSet());
    return new AuthResponse(token, "Bearer", user.getId(), user.getFullName(), user.getEmail(), user.getMobile(), roles);
  }

  private String saveDocument(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      return null;
    }

    String originalFilename = file.getOriginalFilename() == null ? "document" : file.getOriginalFilename();
    String safeFilename = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
    Path uploadDirectory = Path.of("uploads", "registration-documents");
    Path destination = uploadDirectory.resolve(UUID.randomUUID() + "-" + safeFilename).normalize();

    try {
      Files.createDirectories(uploadDirectory);
      file.transferTo(destination);
      return destination.toString();
    } catch (IOException exception) {
      throw new BadRequestException("Unable to save registration document");
    }
  }
}
