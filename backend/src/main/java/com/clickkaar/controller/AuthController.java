package com.clickkaar.controller;

import com.clickkaar.dto.auth.*;
import com.clickkaar.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
  private final AuthService authService;

  @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @ResponseStatus(HttpStatus.CREATED)
  public RegistrationResponse register(@Valid @ModelAttribute RegisterRequest request) {
    return authService.register(request);
  }

  @PostMapping("/login")
  public AuthResponse login(@Valid @RequestBody LoginRequest request) {
    return authService.login(request);
  }

  @PostMapping("/admin/login")
  public AuthResponse adminLogin(@Valid @RequestBody LoginRequest request) {
    return authService.adminLogin(request);
  }

  @PostMapping("/forgot-password")
  public String forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
    return authService.requestPasswordReset(request);
  }

  @PostMapping("/reset-password")
  public String resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
    return authService.resetPassword(request);
  }

  @PostMapping("/change-password")
  public String changePassword(@Valid @RequestBody ChangePasswordRequest request, Authentication authentication) {
    if (authentication == null || !authentication.isAuthenticated() || authentication instanceof AnonymousAuthenticationToken) {
      throw new org.springframework.security.authentication.BadCredentialsException("Login required");
    }
    return authService.changePassword(authentication.getName(), request);
  }

  @PostMapping("/otp/request")
  public String requestOtp(@Valid @RequestBody OtpRequest request) {
    return authService.requestMobileOtp(request);
  }

  @PostMapping("/otp/verify")
  public String verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
    return authService.verifyMobileOtp(request);
  }
}
