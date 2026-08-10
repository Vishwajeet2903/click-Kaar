package com.clickkaar.service;

import com.clickkaar.dto.auth.*;
import com.clickkaar.entity.OTP;
import com.clickkaar.entity.PendingRegistration;
import com.clickkaar.entity.User;
import com.clickkaar.enums.OtpPurpose;
import com.clickkaar.exception.BadRequestException;
import com.clickkaar.repository.OtpRepository;
import com.clickkaar.repository.PendingRegistrationRepository;
import com.clickkaar.repository.UserRepository;
import com.clickkaar.security.CustomUserDetails;
import com.clickkaar.security.JwtService;
import com.clickkaar.util.OtpGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
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
@Slf4j
public class AuthService {
  private final UserRepository userRepository;
  private final PendingRegistrationRepository pendingRegistrationRepository;
  private final OtpRepository otpRepository;
  private final PasswordEncoder passwordEncoder;
  private final AuthenticationManager authenticationManager;
  private final JwtService jwtService;
  private final OtpGenerator otpGenerator;
  private final JavaMailSender mailSender;
  private final Environment environment;

  @Value("${spring.mail.username:}")
  private String mailUsername;

  @Value("${spring.mail.password:}")
  private String mailPassword;

  @Transactional
  public RegistrationResponse register(RegisterRequest request) {
    String email = normalizeEmail(request.email());
    if (userRepository.existsByEmail(email)) {
      throw new BadRequestException("Email is already registered");
    }
    if (pendingRegistrationRepository.existsByEmail(email)) {
      throw new BadRequestException("Email is already pending admin approval");
    }
    if (request.mobile() != null && userRepository.existsByMobile(request.mobile())) {
      throw new BadRequestException("Mobile is already registered");
    }
    if (request.mobile() != null && pendingRegistrationRepository.existsByMobile(request.mobile())) {
      throw new BadRequestException("Mobile is already pending admin approval");
    }
    validateRequiredDocuments(request);

    PendingRegistration pendingRegistration = PendingRegistration.builder()
        .fullName(request.fullName())
        .firstName(request.firstName())
        .lastName(request.lastName())
        .email(email)
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
        .companyBonafideLetterDocumentName(saveDocument(request.companyBonafideLetter()))
        .password(passwordEncoder.encode(request.password()))
        .build();

    PendingRegistration saved = pendingRegistrationRepository.save(pendingRegistration);
    sendRegistrationSubmittedEmail(saved);
    return new RegistrationResponse(
        saved.getId(),
        saved.getFullName(),
        saved.getEmail(),
        saved.getMobile(),
        "PENDING_VERIFICATION",
        "Thank you for choosing Click-Kaar. Your profile is under scrutiny."
    );
  }

  public AuthResponse login(LoginRequest request) {
    String email = normalizeEmail(request.email());
    if (pendingRegistrationRepository.existsByEmail(email)) {
      throw new BadRequestException("Your registration is pending admin verification.");
    }
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
    if (!user.isEnabled()) {
      throw new BadRequestException("Your registration is pending admin verification.");
    }
    authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.password()));
    return authResponse(user);
  }

  public AuthResponse adminLogin(LoginRequest request) {
    AuthResponse response = login(request);
    if (!response.roles().contains("ADMIN") && !response.roles().contains("SUPER_ADMIN")) {
      throw new BadCredentialsException("Admin access required");
    }
    return response;
  }

  @Transactional
  public String requestPasswordReset(ForgotPasswordRequest request) {
    String email = normalizeEmail(request.email());
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new BadRequestException("No active account found for this email"));
    if (!user.isEnabled()) {
      throw new BadRequestException("Your registration is pending admin verification.");
    }

    String code = otpGenerator.generate();
    otpRepository.save(OTP.builder()
        .email(email)
        .code(code)
        .purpose(OtpPurpose.PASSWORD_RESET)
        .expiresAt(LocalDateTime.now().plusMinutes(10))
        .used(false)
        .build());

    if (!isMailConfigured()) {
      if (isLocalProfile()) {
        log.warn("Mail is not configured. Returning password reset code in response for local development only: {}", email);
        return "Password reset code for local development: " + code;
      }
      throw new BadRequestException("Mail is not configured. Please set MAIL_USERNAME and MAIL_PASSWORD.");
    }
    sendPasswordResetEmail(email, code);
    return "Password reset code sent to your email.";
  }

  @Transactional
  public String resetPassword(ResetPasswordRequest request) {
    String email = normalizeEmail(request.email());
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new BadRequestException("No active account found for this email"));
    if (!user.isEnabled()) {
      throw new BadRequestException("Your registration is pending admin verification.");
    }

    OTP otp = otpRepository.findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(email, OtpPurpose.PASSWORD_RESET)
        .orElseThrow(() -> new BadRequestException("Reset code not found"));
    if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
      throw new BadRequestException("Reset code expired");
    }
    if (!otp.getCode().equals(request.code())) {
      throw new BadRequestException("Invalid reset code");
    }

    user.setPassword(passwordEncoder.encode(request.newPassword()));
    otp.setUsed(true);
    userRepository.save(user);
    return "Password reset successfully. You can now log in.";
  }

  @Transactional
  public String changePassword(String email, ChangePasswordRequest request) {
    User user = userRepository.findByEmail(normalizeEmail(email))
        .orElseThrow(() -> new BadRequestException("User not found"));
    if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
      throw new BadRequestException("Current password is incorrect");
    }
    if (passwordEncoder.matches(request.newPassword(), user.getPassword())) {
      throw new BadRequestException("New password must be different from current password");
    }

    user.setPassword(passwordEncoder.encode(request.newPassword()));
    userRepository.save(user);
    return "Password changed successfully.";
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

  private String normalizeEmail(String email) {
    return email == null ? "" : email.trim().toLowerCase();
  }

  private AuthResponse authResponse(User user) {
    String token = jwtService.generateToken(new CustomUserDetails(user));
    Set<String> roles = user.getRoles().stream().map(role -> role.getName().name()).collect(Collectors.toSet());
    return new AuthResponse(token, "Bearer", user.getId(), user.getFullName(), user.getEmail(), user.getMobile(), roles);
  }

  private void sendPasswordResetEmail(String email, String code) {
    try {
      SimpleMailMessage message = new SimpleMailMessage();
      message.setFrom(configuredMailUsername());
      message.setTo(email);
      message.setSubject("Clickkaar password reset code");
      message.setText("Use this code to reset your Clickkaar password: " + code + "\n\nThis code expires in 10 minutes.");
      mailSender.send(message);
      log.info("Password reset email sent to {}", email);
    } catch (MailAuthenticationException exception) {
      log.warn("Unable to send password reset email to {} because SMTP authentication failed for {}", email, configuredMailUsername());
      throw new BadRequestException("Mail authentication failed. Please check SMTP username and password.");
    } catch (MailException exception) {
      log.warn("Unable to send password reset email to {}", email, exception);
      throw new BadRequestException("Unable to send password reset email. Please try again later.");
    }
  }

  private void sendRegistrationSubmittedEmail(PendingRegistration registration) {
    if (!isMailConfigured()) {
      log.warn("Skipping registration email for {} because MAIL_USERNAME or MAIL_PASSWORD is not configured", registration.getEmail());
      return;
    }

    try {
      SimpleMailMessage message = new SimpleMailMessage();
      message.setFrom(configuredMailUsername());
      message.setTo(registration.getEmail());
      message.setSubject("Welcome to ClickKaar - Account Verification in Progress");
      message.setText(
          "Dear " + registration.getFullName() + ",\n\n"
              + "Thank you for registering with ClickKaar.\n\n"
              + "We have successfully received your registration request. Your account is currently under review by the ClickKaar verification team to ensure the authenticity and quality of our platform.\n\n"
              + "What happens next?\n\n"
              + "- Our team will review your submitted details.\n"
              + "- Once your account is verified and approved, you will receive a confirmation email.\n"
              + "- If any additional information is required, our team will contact you.\n\n"
              + "The verification process may take 24-48 business hours.\n\n"
              + "We appreciate your patience and look forward to having you as a part of the ClickKaar community.\n\n"
              + "If you have any questions or need assistance, please feel free to contact our support team.\n\n"
              + "Best Regards,\n"
              + "The ClickKaar Team\n"
              + "ClickKaar Support\n"
              + "Email: clickkaar@gmail.com\n"
              + "Website: https://click-kaar.com/"
      );
      mailSender.send(message);
      log.info("Registration email sent to {}", registration.getEmail());
    } catch (MailAuthenticationException exception) {
      log.warn("Unable to send registration email to {} because SMTP authentication failed for {}", registration.getEmail(), configuredMailUsername());
    } catch (MailException exception) {
      log.warn("Unable to send registration email to {}", registration.getEmail(), exception);
    }
  }

  private boolean isMailConfigured() {
    return !configuredMailUsername().isBlank() && !configuredMailPassword().isBlank();
  }

  private boolean isLocalProfile() {
    return environment.acceptsProfiles(Profiles.of("local"));
  }

  private String configuredMailUsername() {
    return mailUsername == null ? "" : mailUsername.trim();
  }

  private String configuredMailPassword() {
    return mailPassword == null ? "" : mailPassword.trim();
  }

  private void validateRequiredDocuments(RegisterRequest request) {
    requireDocument(request.photo(), "Photo");
    requireDocument(request.drivingLicense(), "Driving license");

    String residenceType = request.residenceType() == null ? "" : request.residenceType().trim().toLowerCase();
    switch (residenceType) {
      case "rented" -> requireDocument(request.rentAgreement(), "Rent agreement");
      case "owned", "family owned", "family home" -> requireDocument(request.electricityBill(), "Electricity bill");
      case "company provided" -> requireDocument(request.companyBonafideLetter(), "Company bonafide letter");
      default -> throw new BadRequestException("Select a valid residence type");
    }
  }

  private void requireDocument(MultipartFile file, String label) {
    if (file == null || file.isEmpty()) {
      throw new BadRequestException(label + " is required");
    }
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

