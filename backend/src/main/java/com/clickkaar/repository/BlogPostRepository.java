package com.clickkaar.repository;

import com.clickkaar.entity.BlogPost;
import com.clickkaar.enums.BlogStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BlogPostRepository extends JpaRepository<BlogPost, Long> {
  Optional<BlogPost> findBySlug(String slug);
  List<BlogPost> findByStatus(BlogStatus status);
}
