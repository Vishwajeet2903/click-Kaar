package com.clickkaar.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;

@Configuration
public class WebConfig implements WebMvcConfigurer {
  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    String uploadRoot = Path.of("uploads").toAbsolutePath().normalize().toUri().toString();
    if (!uploadRoot.endsWith("/")) {
      uploadRoot += "/";
    }
    registry.addResourceHandler("/uploads/**")
        .addResourceLocations(uploadRoot);
  }
}
