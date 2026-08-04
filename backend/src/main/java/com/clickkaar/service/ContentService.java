package com.clickkaar.service;

import com.clickkaar.dto.content.ContactMessageRequest;
import com.clickkaar.dto.content.CustomerReviewRequest;
import com.clickkaar.dto.content.CustomerReviewResponse;
import com.clickkaar.dto.content.FaqRequest;
import com.clickkaar.dto.content.GalleryImageRequest;
import com.clickkaar.dto.content.GalleryImageResponse;
import com.clickkaar.dto.content.StaticContentRequest;
import com.clickkaar.entity.ContactMessage;
import com.clickkaar.entity.CustomerReview;
import com.clickkaar.entity.Faq;
import com.clickkaar.entity.GalleryImage;
import com.clickkaar.entity.StaticContent;
import com.clickkaar.exception.BadRequestException;
import com.clickkaar.exception.ResourceNotFoundException;
import com.clickkaar.repository.ContactMessageRepository;
import com.clickkaar.repository.CustomerReviewRepository;
import com.clickkaar.repository.FaqRepository;
import com.clickkaar.repository.GalleryImageRepository;
import com.clickkaar.repository.StaticContentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ContentService {
  private final ContactMessageRepository contactMessageRepository;
  private final CustomerReviewRepository customerReviewRepository;
  private final FaqRepository faqRepository;
  private final GalleryImageRepository galleryImageRepository;
  private final StaticContentRepository staticContentRepository;

  public ContactMessage contact(ContactMessageRequest request) {
    // reCAPTCHA validation placeholder: verify request.recaptchaToken() with Google before production.
    return contactMessageRepository.save(ContactMessage.builder()
        .name(request.name())
        .email(request.email())
        .phone(request.phone())
        .message(request.message())
        .resolved(false)
        .build());
  }

  public List<Faq> faqs() {
    return faqRepository.findByActiveTrueOrderByDisplayOrderAsc();
  }

  public List<CustomerReviewResponse> reviews() {
    return customerReviewRepository.findAllByOrderByCreatedAtDesc().stream()
        .map(this::toReviewResponse)
        .toList();
  }

  public CustomerReviewResponse createReview(CustomerReviewRequest request) {
    CustomerReview review = customerReviewRepository.save(CustomerReview.builder()
        .name(request.name().trim())
        .role(request.role().trim())
        .rating(request.rating())
        .quote(request.quote().trim())
        .build());
    return toReviewResponse(review);
  }

  public List<GalleryImageResponse> galleryImages() {
    return galleryImageRepository.findByActiveTrueOrderByDisplayOrderAscCreatedAtDesc().stream()
        .map(this::toGalleryImageResponse)
        .toList();
  }

  public List<GalleryImageResponse> allGalleryImages() {
    return galleryImageRepository.findAllByOrderByDisplayOrderAscCreatedAtDesc().stream()
        .map(this::toGalleryImageResponse)
        .toList();
  }

  @Transactional
  public GalleryImageResponse createGalleryImage(GalleryImageRequest request) {
    String imageUrl = request.imageUrl().trim();
    if (galleryImageRepository.existsByImageUrlIgnoreCase(imageUrl)) {
      throw new BadRequestException("Gallery image already exists");
    }
    GalleryImage image = galleryImageRepository.save(GalleryImage.builder()
        .imageUrl(imageUrl)
        .altText(request.altText().trim())
        .wide(request.wide())
        .tall(request.tall())
        .displayOrder(request.displayOrder())
        .active(request.active() == null || request.active())
        .build());
    return toGalleryImageResponse(image);
  }

  @Transactional
  public GalleryImageResponse uploadGalleryImage(MultipartFile file, String altText, boolean wide, boolean tall, Integer displayOrder, Boolean active) {
    if (file == null || file.isEmpty()) {
      throw new BadRequestException("Choose an image to upload");
    }
    String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
    if (!contentType.startsWith("image/")) {
      throw new BadRequestException("Gallery upload must be an image");
    }
    if (altText == null || altText.isBlank()) {
      throw new BadRequestException("Alt text is required");
    }
    if (displayOrder == null || displayOrder < 1) {
      throw new BadRequestException("Display order must be at least 1");
    }

    String originalFilename = file.getOriginalFilename() == null ? "gallery-image" : file.getOriginalFilename();
    String safeFilename = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
    Path uploadDirectory = Path.of("uploads", "gallery");
    Path destination = uploadDirectory.resolve(UUID.randomUUID() + "-" + safeFilename).normalize();

    try {
      Files.createDirectories(uploadDirectory);
      file.transferTo(destination);
    } catch (IOException exception) {
      throw new BadRequestException("Unable to save gallery image");
    }

    String imageUrl = "/uploads/gallery/" + destination.getFileName();
    GalleryImage image = galleryImageRepository.save(GalleryImage.builder()
        .imageUrl(imageUrl)
        .altText(altText.trim())
        .wide(wide)
        .tall(tall)
        .displayOrder(displayOrder)
        .active(active == null || active)
        .build());
    return toGalleryImageResponse(image);
  }

  @Transactional
  public void deleteGalleryImage(Long imageId) {
    if (!galleryImageRepository.existsById(imageId)) {
      throw new ResourceNotFoundException("Gallery image not found");
    }
    galleryImageRepository.deleteById(imageId);
  }

  @Transactional
  public CustomerReviewResponse replyToReview(Long reviewId, String reply) {
    CustomerReview review = customerReviewRepository.findById(reviewId)
        .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
    review.setAdminReply(reply == null || reply.isBlank() ? null : reply.trim());
    return toReviewResponse(customerReviewRepository.save(review));
  }

  @Transactional
  public void deleteReview(Long reviewId) {
    if (!customerReviewRepository.existsById(reviewId)) {
      throw new ResourceNotFoundException("Review not found");
    }
    customerReviewRepository.deleteById(reviewId);
  }

  public Faq createFaq(FaqRequest request) {
    return faqRepository.save(Faq.builder()
        .question(request.question())
        .answer(request.answer())
        .active(request.active())
        .displayOrder(request.displayOrder())
        .build());
  }

  public StaticContent getContent(String pageKey) {
    return staticContentRepository.findByPageKey(pageKey).orElseThrow(() -> new ResourceNotFoundException("Content not found"));
  }

  @Transactional
  public StaticContent saveContent(StaticContentRequest request) {
    StaticContent content = staticContentRepository.findByPageKey(request.pageKey()).orElseGet(StaticContent::new);
    content.setPageKey(request.pageKey());
    content.setContent(request.content());
    return staticContentRepository.save(content);
  }

  private CustomerReviewResponse toReviewResponse(CustomerReview review) {
    return new CustomerReviewResponse(
        review.getId(),
        review.getName(),
        review.getRole(),
        review.getRating(),
        review.getQuote(),
        review.getAdminReply(),
        review.getAvatar(),
        review.getCreatedAt()
    );
  }

  private GalleryImageResponse toGalleryImageResponse(GalleryImage image) {
    return new GalleryImageResponse(
        image.getId(),
        image.getImageUrl(),
        image.getAltText(),
        image.isWide(),
        image.isTall(),
        image.isActive(),
        image.getDisplayOrder(),
        image.getCreatedAt(),
        image.getUpdatedAt()
    );
  }
}
