package com.clickkaar.service;

import com.clickkaar.dto.content.ContactMessageRequest;
import com.clickkaar.dto.content.FaqRequest;
import com.clickkaar.dto.content.StaticContentRequest;
import com.clickkaar.entity.ContactMessage;
import com.clickkaar.entity.Faq;
import com.clickkaar.entity.StaticContent;
import com.clickkaar.exception.ResourceNotFoundException;
import com.clickkaar.repository.ContactMessageRepository;
import com.clickkaar.repository.FaqRepository;
import com.clickkaar.repository.StaticContentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ContentService {
  private final ContactMessageRepository contactMessageRepository;
  private final FaqRepository faqRepository;
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
}
