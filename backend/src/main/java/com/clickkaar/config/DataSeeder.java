package com.clickkaar.config;

import com.clickkaar.entity.*;
import com.clickkaar.enums.*;
import com.clickkaar.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

@Configuration
@RequiredArgsConstructor
public class DataSeeder {
  private final RoleRepository roleRepository;
  private final UserRepository userRepository;
  private final CategoryRepository categoryRepository;
  private final ProductRepository productRepository;
  private final BlogPostRepository blogPostRepository;
  private final FaqRepository faqRepository;
  private final StaticContentRepository staticContentRepository;
  private final PasswordEncoder passwordEncoder;

  @Bean
  CommandLineRunner seedClickkaarData() {
    return args -> {
      Role customer = roleRepository.findByName(RoleName.CUSTOMER)
          .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.CUSTOMER).build()));
      roleRepository.findByName(RoleName.EMPLOYEE)
          .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.EMPLOYEE).build()));
      Role admin = roleRepository.findByName(RoleName.ADMIN)
          .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.ADMIN).build()));

      if (!userRepository.existsByEmail("admin@clickkaar.com")) {
        userRepository.save(User.builder()
            .fullName("Clickkaar Admin")
            .email("admin@clickkaar.com")
            .mobile("9999999999")
            .password(passwordEncoder.encode("Admin@123"))
            .enabled(true)
            .mobileVerified(true)
            .roles(Set.of(admin))
            .build());
      }

      for (ProductCategory value : ProductCategory.values()) {
        categoryRepository.findByName(value).orElseGet(() -> categoryRepository.save(Category.builder()
            .name(value)
            .displayName(value.name().replace('_', ' '))
            .description("Rental equipment category")
            .build()));
      }

      if (productRepository.count() == 0) {
        Category camera = categoryRepository.findByName(ProductCategory.CAMERAS).orElseThrow();
        Category lens = categoryRepository.findByName(ProductCategory.LENSES).orElseThrow();
        productRepository.save(Product.builder()
            .name("Canon R5 Kit")
            .brand("Canon")
            .category(camera)
            .shortDescription("Full-frame camera kit for wedding and commercial shoots.")
            .fullDescription("Includes body, batteries, charger, and memory card support.")
            .specs("45MP, 8K video, IBIS")
            .dailyPrice(new BigDecimal("4200"))
            .weeklyPrice(new BigDecimal("24000"))
            .availabilityStatus(AvailabilityStatus.AVAILABLE)
            .build());
        productRepository.save(Product.builder()
            .name("24-70mm Prime Lens")
            .brand("Sigma")
            .category(lens)
            .shortDescription("Sharp versatile lens for events and portraits.")
            .fullDescription("Reliable lens option for hybrid creators.")
            .specs("f/2.8, full-frame compatible")
            .dailyPrice(new BigDecimal("899"))
            .weeklyPrice(new BigDecimal("5200"))
            .availabilityStatus(AvailabilityStatus.AVAILABLE)
            .build());
      }

      if (blogPostRepository.count() == 0) {
        blogPostRepository.save(BlogPost.builder()
            .title("How to Choose a Camera Kit for Your First Paid Shoot")
            .slug("choose-camera-kit-first-paid-shoot")
            .authorName("Clickkaar Team")
            .publishDate(LocalDate.now())
            .category("Guides")
            .tags("camera,rental,creator")
            .seoTitle("Camera Rental Guide")
            .seoDescription("A starter guide for choosing rental camera gear.")
            .content("Start with the shoot type, lighting conditions, and backup needs.")
            .status(BlogStatus.PUBLISHED)
            .build());
      }

      if (faqRepository.count() == 0) {
        faqRepository.save(Faq.builder()
            .question("Do I need ID proof to rent equipment?")
            .answer("Yes, verified identity and booking confirmation are required before handover.")
            .active(true)
            .displayOrder(1)
            .build());
      }

      staticContentRepository.findByPageKey("terms").orElseGet(() -> staticContentRepository.save(StaticContent.builder()
          .pageKey("terms")
          .content("Clickkaar rental terms placeholder.")
          .build()));
      staticContentRepository.findByPageKey("privacy").orElseGet(() -> staticContentRepository.save(StaticContent.builder()
          .pageKey("privacy")
          .content("Clickkaar privacy policy placeholder.")
          .build()));
    };
  }
}
