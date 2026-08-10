package com.clickkaar.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
  @ExceptionHandler(ResourceNotFoundException.class)
  ResponseEntity<ApiError> handleNotFound(ResourceNotFoundException ex) {
    return error(HttpStatus.NOT_FOUND, ex.getMessage(), Map.of());
  }

  @ExceptionHandler({BadRequestException.class, BadCredentialsException.class})
  ResponseEntity<ApiError> handleBadRequest(RuntimeException ex) {
    return error(HttpStatus.BAD_REQUEST, ex.getMessage(), Map.of());
  }

  @ExceptionHandler(RazorpayAuthenticationException.class)
  ResponseEntity<ApiError> handleRazorpayAuthentication(RazorpayAuthenticationException ex) {
    return error(HttpStatus.UNAUTHORIZED, ex.getMessage(), Map.of());
  }

  @ExceptionHandler(RazorpayApiException.class)
  ResponseEntity<ApiError> handleRazorpayApi(RazorpayApiException ex) {
    return error(HttpStatus.INTERNAL_SERVER_ERROR, ex.getMessage(), Map.of());
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
    Map<String, String> fields = new HashMap<>();
    ex.getBindingResult().getFieldErrors().forEach(error -> fields.put(error.getField(), error.getDefaultMessage()));
    return error(HttpStatus.BAD_REQUEST, "Validation failed", fields);
  }

  @ExceptionHandler({AccessDeniedException.class, AuthorizationDeniedException.class})
  ResponseEntity<ApiError> handleAccessDenied(RuntimeException ex) {
    return error(HttpStatus.FORBIDDEN, "Access denied", Map.of());
  }

  @ExceptionHandler(Exception.class)
  ResponseEntity<ApiError> handleGeneric(Exception ex) {
    return error(HttpStatus.INTERNAL_SERVER_ERROR, ex.getMessage(), Map.of());
  }

  private ResponseEntity<ApiError> error(HttpStatus status, String message, Map<String, String> errors) {
    return ResponseEntity.status(status).body(new ApiError(LocalDateTime.now(), status.value(), message, errors));
  }
}
