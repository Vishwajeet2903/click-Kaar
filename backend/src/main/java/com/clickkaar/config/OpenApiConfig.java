package com.clickkaar.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
  @Bean
  OpenAPI clickkaarOpenApi() {
    return new OpenAPI()
        .info(new Info()
            .title("Clickkaar Backend API")
            .version("v1")
            .description("Rental marketplace APIs for photography and videography equipment."));
  }
}
