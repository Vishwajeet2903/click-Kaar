package com.clickkaar.controller;

import com.clickkaar.dto.content.ContactMessageRequest;
import com.clickkaar.dto.content.CustomerReviewRequest;
import com.clickkaar.dto.content.CustomerReviewResponse;
import com.clickkaar.dto.content.FaqRequest;
import com.clickkaar.dto.content.GalleryImageResponse;
import com.clickkaar.dto.content.StaticContentRequest;
import com.clickkaar.dto.admin.KitResponse;
import com.clickkaar.entity.ContactMessage;
import com.clickkaar.entity.Faq;
import com.clickkaar.entity.StaticContent;
import com.clickkaar.service.ContentService;
import com.clickkaar.service.KitService;
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
  private final KitService kitService;

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

  @GetMapping("/gallery")
  public List<GalleryImageResponse> gallery() {
    return contentService.galleryImages();
  }

  @PostMapping("/reviews")
  public CustomerReviewResponse createReview(@Valid @RequestBody CustomerReviewRequest request) {
    return contentService.createReview(request);
  }

  @DeleteMapping("/reviews/{reviewId}")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CONTENT_EDITOR')")
  public void deleteReview(@PathVariable Long reviewId) {
    contentService.deleteReview(reviewId);
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
