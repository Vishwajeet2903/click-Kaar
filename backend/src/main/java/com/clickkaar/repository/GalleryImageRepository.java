package com.clickkaar.repository;

import com.clickkaar.entity.GalleryImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GalleryImageRepository extends JpaRepository<GalleryImage, Long> {
  List<GalleryImage> findByActiveTrueOrderByDisplayOrderAscCreatedAtDesc();

  List<GalleryImage> findAllByOrderByDisplayOrderAscCreatedAtDesc();

  boolean existsByImageUrlIgnoreCase(String imageUrl);
}
