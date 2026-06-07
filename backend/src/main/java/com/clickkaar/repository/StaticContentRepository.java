package com.clickkaar.repository;

import com.clickkaar.entity.StaticContent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StaticContentRepository extends JpaRepository<StaticContent, Long> {
  Optional<StaticContent> findByPageKey(String pageKey);
}
