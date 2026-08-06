package com.clickkaar.controller;

import com.clickkaar.dto.blog.BlogPostRequest;
import com.clickkaar.entity.BlogPost;
import com.clickkaar.service.BlogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/blog")
@RequiredArgsConstructor
public class BlogController {
  private final BlogService blogService;

  @GetMapping
  public List<BlogPost> published() {
    return blogService.published();
  }

  @GetMapping("/{slug}")
  public BlogPost bySlug(@PathVariable String slug) {
    return blogService.bySlug(slug);
  }

  @PostMapping
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CONTENT_EDITOR')")
  public BlogPost create(@Valid @RequestBody BlogPostRequest request) {
    return blogService.create(request);
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CONTENT_EDITOR')")
  public BlogPost update(@PathVariable Long id, @Valid @RequestBody BlogPostRequest request) {
    return blogService.update(id, request);
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CONTENT_EDITOR')")
  public void delete(@PathVariable Long id) {
    blogService.delete(id);
  }
}

