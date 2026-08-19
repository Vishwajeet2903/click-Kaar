package com.clickkaar.controller;

import com.clickkaar.entity.UploadedImage;
import com.clickkaar.exception.ResourceNotFoundException;
import com.clickkaar.repository.UploadedImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.TimeUnit;

@RestController
@RequiredArgsConstructor
public class UploadController {
  private final UploadedImageRepository uploadedImageRepository;

  @GetMapping("/uploads/{folder}/{filename:.+}")
  public ResponseEntity<byte[]> image(@PathVariable String folder, @PathVariable String filename) {
    String path = "/uploads/" + folder + "/" + filename;
    UploadedImage image = uploadedImageRepository.findByPath(path)
        .orElseThrow(() -> new ResourceNotFoundException("Image not found"));

    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType(image.getContentType()))
        .cacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic())
        .body(image.getData());
  }
}
