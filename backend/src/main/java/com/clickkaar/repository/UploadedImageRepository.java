package com.clickkaar.repository;

import com.clickkaar.entity.UploadedImage;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UploadedImageRepository extends JpaRepository<UploadedImage, Long> {
  Optional<UploadedImage> findByPath(String path);
}
