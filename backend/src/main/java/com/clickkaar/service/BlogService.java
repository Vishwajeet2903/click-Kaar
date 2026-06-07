package com.clickkaar.service;

import com.clickkaar.dto.blog.BlogPostRequest;
import com.clickkaar.entity.BlogPost;
import com.clickkaar.enums.BlogStatus;
import com.clickkaar.exception.ResourceNotFoundException;
import com.clickkaar.repository.BlogPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BlogService {
  private final BlogPostRepository blogPostRepository;

  public List<BlogPost> published() {
    return blogPostRepository.findByStatus(BlogStatus.PUBLISHED);
  }

  public BlogPost bySlug(String slug) {
    return blogPostRepository.findBySlug(slug).orElseThrow(() -> new ResourceNotFoundException("Blog post not found"));
  }

  @Transactional
  public BlogPost create(BlogPostRequest request) {
    return blogPostRepository.save(toEntity(new BlogPost(), request));
  }

  @Transactional
  public BlogPost update(Long id, BlogPostRequest request) {
    BlogPost post = blogPostRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Blog post not found"));
    return toEntity(post, request);
  }

  public void delete(Long id) {
    blogPostRepository.deleteById(id);
  }

  private BlogPost toEntity(BlogPost post, BlogPostRequest request) {
    post.setTitle(request.title());
    post.setSlug(request.slug());
    post.setCoverImage(request.coverImage());
    post.setAuthorName(request.authorName());
    post.setPublishDate(request.publishDate());
    post.setCategory(request.category());
    post.setTags(request.tags());
    post.setSeoTitle(request.seoTitle());
    post.setSeoDescription(request.seoDescription());
    post.setSeoKeywords(request.seoKeywords());
    post.setContent(request.content());
    post.setStatus(request.status());
    return post;
  }
}
