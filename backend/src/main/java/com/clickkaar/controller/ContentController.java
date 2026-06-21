package com.clickkaar.controller;

import com.clickkaar.dto.content.ContactMessageRequest;
import com.clickkaar.dto.content.CustomerReviewRequest;
import com.clickkaar.dto.content.CustomerReviewResponse;
import com.clickkaar.dto.content.FaqRequest;
import com.clickkaar.dto.content.StaticContentRequest;
import com.clickkaar.entity.ContactMessage;
import com.clickkaar.entity.Faq;
import com.clickkaar.entity.StaticContent;
import com.clickkaar.service.ContentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/content")
@RequiredArgsConstructor
public class ContentController {
  private final ContentService contentService;

  @PostMapping("/contact")
  public ContactMessage contact(@Valid @RequestBody ContactMessageRequest request) {
    return contentService.contact(request);
  }

  @GetMapping("/faqs")
  public List<Faq> faqs() {
    return contentService.faqs();
  }

  @GetMapping("/reviews")
  public List<CustomerReviewResponse> reviews() {
    return contentService.reviews();
  }

  @PostMapping("/reviews")
  public CustomerReviewResponse createReview(@Valid @RequestBody CustomerReviewRequest request) {
    return contentService.createReview(request);
  }

  @PostMapping("/faqs")
  @PreAuthorize("hasRole('ADMIN')")
  public Faq createFaq(@Valid @RequestBody FaqRequest request) {
    return contentService.createFaq(request);
  }

  @GetMapping("/{pageKey}")
  public StaticContent getContent(@PathVariable String pageKey) {
    return contentService.getContent(pageKey);
  }

  @PutMapping
  @PreAuthorize("hasRole('ADMIN')")
  public StaticContent saveContent(@Valid @RequestBody StaticContentRequest request) {
    return contentService.saveContent(request);
  }
}
