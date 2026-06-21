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
import java.util.List;
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
  private final CustomerReviewRepository customerReviewRepository;
  private final StaticContentRepository staticContentRepository;
  private final BookingRepository bookingRepository;
  private final PaymentRepository paymentRepository;
  private final WishlistRepository wishlistRepository;
  private final AdminNoteRepository adminNoteRepository;
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

      User adminUser = seedUser("Clickkaar Admin", "admin@clickkaar.com", "9999999999", Set.of(admin), true);
      seedCategories();
      seedProducts();
      seedBlogs();
      seedFaqs();
      seedCustomerReviews();
      seedStaticContent();

      User aarav = seedUser("Aarav Mehta", "aarav@example.com", "9876543210", Set.of(customer), true);
      User neha = seedUser("Neha Sharma", "neha@example.com", "9898989898", Set.of(customer), true);
      User kabir = seedUser("Kabir Khan", "kabir@example.com", "9765432109", Set.of(customer), false);
      User riya = seedUser("Riya Patel", "riya@example.com", "9988776655", Set.of(customer), true);

      seedWishlists(aarav, 4);
      seedWishlists(neha, 2);
      seedWishlists(kabir, 1);
      seedBookingsAndPayments(adminUser, aarav, neha, kabir, riya);
    };
  }

  private void seedCategories() {
    for (ProductCategory value : ProductCategory.values()) {
      categoryRepository.findByName(value).orElseGet(() -> categoryRepository.save(Category.builder()
          .name(value)
          .displayName(displayCategory(value))
          .description("Rental equipment category")
          .build()));
    }
  }

  private void seedProducts() {
    seedProduct("Canon EOS R5 Cinema Kit", "Canon", ProductCategory.CAMERAS,
        "A high-resolution mirrorless workhorse for commercial stills, hybrid shoots, and crisp 8K capture.",
        "A high-resolution mirrorless workhorse for commercial stills, hybrid shoots, and crisp 8K capture.",
        "Sensor: 45MP full-frame CMOS, Video: 8K RAW, Mount: RF, Stabilization: In-body 5-axis",
        "4200", "21800", AvailabilityStatus.AVAILABLE,
        List.of(img("photo-1516035069371-29a1b244cc32"), img("photo-1502920917128-1aa500764cbd"), img("photo-1495707902641-75cac588d2e9")));
    seedProduct("Sony Alpha A7S III", "Sony", ProductCategory.CAMERAS,
        "Low-light video favorite with fast autofocus, deep dynamic range, and compact rigging options.",
        "Low-light video favorite with fast autofocus, deep dynamic range, and compact rigging options.",
        "Sensor: 12.1MP full-frame, Video: 4K 120p, Profiles: S-Log3 HLG, Slots: Dual CFexpress/SD",
        "3900", "19900", AvailabilityStatus.AVAILABLE,
        List.of(img("photo-1500634245200-e5245c7574ef"), img("photo-1495121553079-4c61bcce1894")));
    seedProduct("Nikon Z 24-70mm f/2.8 S", "Nikon", ProductCategory.LENSES,
        "Fast, sharp standard zoom for portraits, events, documentaries, and travel assignments.",
        "Fast, sharp standard zoom for portraits, events, documentaries, and travel assignments.",
        "Mount: Nikon Z, Aperture: f/2.8, Range: 24-70mm, WeatherSealed: Yes",
        "1600", "8200", AvailabilityStatus.AVAILABLE,
        List.of(img("photo-1617005082133-548c4dd27f35"), img("photo-1585829365295-ab7cd400c167")));
    seedProduct("Sigma 85mm f/1.4 Art", "Sigma", ProductCategory.LENSES,
        "Portrait prime with creamy falloff, high contrast, and beautiful subject separation.",
        "Portrait prime with creamy falloff, high contrast, and beautiful subject separation.",
        "Mount: E / RF / Z, Aperture: f/1.4, Elements: 14 elements, Focus: HSM AF",
        "1200", "5900", AvailabilityStatus.UNAVAILABLE,
        List.of(img("photo-1512790182412-b19e6d62bc39"), img("photo-1542038784456-1ea8e935640e")));
    seedProduct("Aputure LS 600D Pro", "Aputure", ProductCategory.LIGHTING,
        "Daylight-balanced LED fixture with serious punch for interviews, sets, and location work.",
        "Daylight-balanced LED fixture with serious punch for interviews, sets, and location work.",
        "Output: 600W LED, Color: 5600K, Control: DMX Sidus Link, Power: AC / V-mount",
        "2500", "12800", AvailabilityStatus.AVAILABLE,
        List.of(img("photo-1554048612-b6a482bc67e5"), img("photo-1520299607509-dcd935f9a839")));
    seedProduct("Rode Wireless PRO Kit", "Rode", ProductCategory.AUDIO,
        "Compact dual-channel wireless audio system with onboard recording and creator-friendly controls.",
        "Compact dual-channel wireless audio system with onboard recording and creator-friendly controls.",
        "Channels: 2, Recording: 32-bit float, Range: 260m line-of-sight, Battery: Up to 7 hours",
        "900", "4300", AvailabilityStatus.AVAILABLE,
        List.of(img("photo-1590602847861-f357a9332bbc"), img("photo-1516280440614-37939bbacd81")));
    seedProduct("Manfrotto 504X Fluid Video Tripod", "Manfrotto", ProductCategory.TRIPODS_SUPPORT,
        "Stable video support with smooth pans, counterbalance, and fast field setup.",
        "Stable video support with smooth pans, counterbalance, and fast field setup.",
        "Payload: 12kg, Head: Fluid, Legs: Aluminum twin, Plate: 504PLONGR",
        "850", "4100", AvailabilityStatus.AVAILABLE,
        List.of(img("photo-1607462109225-6b64ae2dd3cb"), img("photo-1606983340126-99ab4feaa64a")));
    seedProduct("DJI RS 4 Pro Gimbal", "DJI", ProductCategory.ACCESSORIES,
        "Professional stabilization for mirrorless and cinema cameras with fast balancing and tracking support.",
        "Professional stabilization for mirrorless and cinema cameras with fast balancing and tracking support.",
        "Payload: 4.5kg, Axis: 3-axis, Runtime: 13 hours, Features: LiDAR-ready",
        "1800", "8800", AvailabilityStatus.AVAILABLE,
        List.of(img("photo-1520549233664-03f65c1d1327"), img("photo-1516724562728-afc824a36e84")));
  }

  private Product seedProduct(String name, String brand, ProductCategory categoryName, String shortDescription, String fullDescription, String specs,
                              String dailyPrice, String weeklyPrice, AvailabilityStatus status, List<String> images) {
    return productRepository.findByNameIgnoreCase(name).orElseGet(() -> {
      Category category = categoryRepository.findByName(categoryName).orElseThrow();
      Product product = Product.builder()
          .name(name)
          .brand(brand)
          .category(category)
          .shortDescription(shortDescription)
          .fullDescription(fullDescription)
          .specs(specs)
          .dailyPrice(new BigDecimal(dailyPrice))
          .weeklyPrice(new BigDecimal(weeklyPrice))
          .availabilityStatus(status)
          .build();
      images.forEach(url -> product.getImages().add(ProductImage.builder()
          .imageUrl(url)
          .primaryImage(product.getImages().isEmpty())
          .product(product)
          .build()));
      return productRepository.save(product);
    });
  }

  private void seedBlogs() {
    seedBlog("camera-kit-for-weddings", "Building a Reliable Wedding Camera Kit", "Guides", "Clickkaar Studio Team", "2026-05-18",
        "A practical rental checklist for hybrid wedding shooters.",
        "Start with two bodies, fast standard glass, and enough lighting control to handle unpredictable venues.\n\nRenting lets you match each wedding brief without over-investing in gear that sits idle between seasons.",
        cover("photo-1519741497674-611481863552"), BlogStatus.PUBLISHED);
    seedBlog("lighting-interview-setups", "Three Interview Lighting Setups That Travel Well", "Lighting", "Aarav Mehta", "2026-05-07",
        "Compact lighting packages for corporate, documentary, and creator shoots.",
        "A key light, compact fill, and controllable background accent can transform small rooms.\n\nChoose battery-ready fixtures when locations are uncertain or fast-moving.",
        cover("photo-1492691527719-9d1e07e534b4"), BlogStatus.PUBLISHED);
    seedBlog("choose-lens-for-portraits", "How to Choose the Right Portrait Lens", "Lenses", "Nisha Rao", "2026-04-29",
        "Focal length, compression, aperture, and the look your client actually needs.",
        "The best portrait lens depends on distance, background, light, and the mood of the shoot.\n\nAn 85mm prime is flattering, but a fast 35mm can be stronger for environmental portraits.",
        cover("photo-1524504388940-b1c1722653e1"), BlogStatus.PUBLISHED);
    seedBlog("best-lenses-for-pune-wedding-films", "Best lenses for Pune wedding films", "Gear guide", "Clickkaar Team", "2026-06-02",
        "A practical lens rental guide for wedding filmmakers.",
        "Pair fast zooms with reliable portrait primes for long wedding days.",
        cover("photo-1519741497674-611481863552"), BlogStatus.PUBLISHED);
    seedBlog("how-to-choose-a-wireless-mic-kit", "How to choose a wireless mic kit", "Audio", "Clickkaar Team", "2026-06-20",
        "Compare creator-friendly wireless microphones.",
        "Start with channel count, backup recording, range, and battery life before choosing a wireless audio rental.",
        cover("photo-1590602847861-f357a9332bbc"), BlogStatus.DRAFT);
  }

  private void seedBlog(String slug, String title, String category, String author, String date, String excerpt, String content, String coverImage, BlogStatus status) {
    blogPostRepository.findBySlug(slug).orElseGet(() -> blogPostRepository.save(BlogPost.builder()
        .title(title)
        .slug(slug)
        .coverImage(coverImage)
        .authorName(author)
        .publishDate(LocalDate.parse(date))
        .category(category)
        .tags(category.toLowerCase().replace(' ', ','))
        .seoTitle(title)
        .seoDescription(excerpt)
        .content(content)
        .status(status)
        .build()));
  }

  private void seedFaqs() {
    if (faqRepository.count() > 0) {
      return;
    }
    faqRepository.save(Faq.builder().question("Is this connected to a backend?").answer("Yes. Demo data is seeded into the Clickkaar database for development.").active(true).displayOrder(1).build());
    faqRepository.save(Faq.builder().question("Can I choose rental dates?").answer("Yes. Product details include datepickers and automatic duration pricing.").active(true).displayOrder(2).build());
    faqRepository.save(Faq.builder().question("Are payments real?").answer("Razorpay integration is available when credentials are configured; cash booking is also supported.").active(true).displayOrder(3).build());
    faqRepository.save(Faq.builder().question("Can products be filtered?").answer("Yes. Catalogue supports category, brand, price, availability, search, sorting, and pagination.").active(true).displayOrder(4).build());
  }

  private void seedCustomerReviews() {
    seedCustomerReview(
        "Aarav Mehta",
        "Product photographer",
        "The kit arrived clean, charged, and exactly matched the booking. We finished a two-day product shoot without chasing backups.",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80");
    seedCustomerReview(
        "Nisha Rao",
        "Brand filmmaker",
        "Click-Kaar helped us pick lenses, lights, and audio in one call. The pricing was clear and pickup was smooth.",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80");
    seedCustomerReview(
        "Kabir Sethi",
        "Wedding creator",
        "I booked a mirrorless body and primes for a wedding reel at the last minute. Everything was ready before call time.",
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=80");
    seedCustomerReview(
        "Meera Iyer",
        "Studio producer",
        "The studio lighting kit was packed beautifully and the team explained every modifier before handoff.",
        "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=160&q=80");
    seedCustomerReview(
        "Rohan Dutta",
        "Commercial director",
        "We rented audio and gimbal gear for a food campaign. The booking stayed simple even when our dates changed.",
        "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=160&q=80");
    seedCustomerReview(
        "Tara Shah",
        "Content creator",
        "Great recommendations, quick confirmation, and no surprises on deposit or daily pricing.",
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=160&q=80");
  }

  private void seedCustomerReview(String name, String role, String quote, String avatar) {
    if (customerReviewRepository.existsByNameIgnoreCaseAndQuoteIgnoreCase(name, quote)) {
      return;
    }

    customerReviewRepository.save(CustomerReview.builder()
        .name(name)
        .role(role)
        .rating(5)
        .quote(quote)
        .avatar(avatar)
        .build());
  }

  private void seedStaticContent() {
    seedStaticContent("faq", "FAQ content is managed from the admin panel.");
    seedStaticContent("terms", "Clickkaar rental terms placeholder.");
    seedStaticContent("privacy", "Clickkaar privacy policy placeholder.");
    seedStaticContent("home", "Homepage featured gear content placeholder.");
  }

  private void seedStaticContent(String pageKey, String content) {
    staticContentRepository.findByPageKey(pageKey).orElseGet(() -> staticContentRepository.save(StaticContent.builder()
        .pageKey(pageKey)
        .content(content)
        .build()));
  }

  private User seedUser(String fullName, String email, String mobile, Set<Role> roles, boolean mobileVerified) {
    return userRepository.findByEmail(email).orElseGet(() -> {
      String[] names = fullName.split(" ", 2);
      return userRepository.save(User.builder()
          .fullName(fullName)
          .firstName(names[0])
          .lastName(names.length > 1 ? names[1] : "")
          .email(email)
          .mobile(mobile)
          .password(passwordEncoder.encode(email.equals("admin@clickkaar.com") ? "Admin@123" : "password123"))
          .enabled(true)
          .mobileVerified(mobileVerified)
          .city(email.contains("neha") ? "Mumbai" : "Pune")
          .state("Maharashtra")
          .country("India")
          .roles(roles)
          .build());
    });
  }

  private void seedWishlists(User user, int count) {
    List<Product> products = productRepository.findAll();
    for (int index = 0; index < Math.min(count, products.size()); index += 1) {
      Product product = products.get(index);
      if (!wishlistRepository.existsByUserIdAndProductId(user.getId(), product.getId())) {
        wishlistRepository.save(Wishlist.builder().user(user).product(product).build());
      }
    }
  }

  private void seedBookingsAndPayments(User admin, User aarav, User neha, User kabir, User riya) {
    seedBooking("CKB-1048", aarav, List.of("Canon EOS R5 Cinema Kit", "Aputure LS 600D Pro"), "2026-06-19", "2026-06-22", BookingStatus.CONFIRMED,
        "13400", PaymentStatus.PAID, PaymentType.FULL_PAYMENT, "Delivery to Baner studio.", admin);
    seedBooking("CKB-1047", neha, List.of("Sony Alpha A7S III"), "2026-06-14", "2026-06-17", BookingStatus.ACTIVE,
        "11700", PaymentStatus.PAID, PaymentType.SECURITY_DEPOSIT, "Security deposit collected.", admin);
    seedBooking("CKB-1046", kabir, List.of("Sigma 85mm f/1.4 Art"), "2026-06-10", "2026-06-12", BookingStatus.OVERDUE,
        "3600", PaymentStatus.PENDING, PaymentType.SECURITY_DEPOSIT, "Call customer before refund processing.", admin);
    seedBooking("CKB-1045", riya, List.of("Rode Wireless PRO Kit"), "2026-06-02", "2026-06-05", BookingStatus.COMPLETED,
        "2700", PaymentStatus.PAID, PaymentType.FULL_PAYMENT, "Returned in good condition.", admin);
  }

  private void seedBooking(String bookingNumber, User customer, List<String> productNames, String start, String end, BookingStatus status,
                           String totalAmount, PaymentStatus paymentStatus, PaymentType paymentType, String note, User admin) {
    if (bookingRepository.existsByBookingNumber(bookingNumber)) {
      return;
    }
    LocalDate startDate = LocalDate.parse(start);
    LocalDate endDate = LocalDate.parse(end);
    int days = (int) (endDate.toEpochDay() - startDate.toEpochDay()) + 1;
    Booking booking = Booking.builder()
        .bookingNumber(bookingNumber)
        .customer(customer)
        .rentalStartDate(startDate)
        .rentalEndDate(endDate)
        .rentalDays(days)
        .totalAmount(new BigDecimal(totalAmount))
        .status(status)
        .build();
    productNames.forEach(productName -> {
      Product product = productRepository.findByNameIgnoreCase(productName).orElseThrow();
      BigDecimal lineTotal = product.getDailyPrice().multiply(BigDecimal.valueOf(days));
      booking.getItems().add(BookingItem.builder()
          .booking(booking)
          .product(product)
          .dailyPrice(product.getDailyPrice())
          .lineTotal(lineTotal)
          .build());
    });
    Booking savedBooking = bookingRepository.save(booking);
    paymentRepository.save(Payment.builder()
        .booking(savedBooking)
        .type(paymentType)
        .status(paymentStatus)
        .amount(new BigDecimal(totalAmount))
        .razorpayOrderId("order_" + bookingNumber)
        .razorpayPaymentId(paymentStatus == PaymentStatus.PAID ? "pay_" + bookingNumber : null)
        .build());
    adminNoteRepository.save(AdminNote.builder()
        .booking(savedBooking)
        .admin(admin)
        .note(note)
        .build());
  }

  private String displayCategory(ProductCategory category) {
    return switch (category) {
      case CAMERAS -> "Cameras";
      case LENSES -> "Lenses";
      case LIGHTING -> "Lighting";
      case AUDIO -> "Audio Equipment";
      case TRIPODS_SUPPORT -> "Tripods";
      case ACCESSORIES -> "Accessories";
    };
  }

  private String img(String id) {
    return "https://images.unsplash.com/" + id + "?auto=format&fit=crop&w=1200&q=80";
  }

  private String cover(String id) {
    return "https://images.unsplash.com/" + id + "?auto=format&fit=crop&w=1200&q=80";
  }
}
