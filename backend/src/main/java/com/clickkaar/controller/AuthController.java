package com.clickkaar.controller;

import com.clickkaar.dto.auth.*;
import com.clickkaar.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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

  @PostMapping("/otp/request")
  public String requestOtp(@Valid @RequestBody OtpRequest request) {
    return authService.requestMobileOtp(request);
  }

  @PostMapping("/otp/verify")
  public String verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
    return authService.verifyMobileOtp(request);
  }
}
