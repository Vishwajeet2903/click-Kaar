package com.clickkaar.config;

import com.clickkaar.entity.*;
import com.clickkaar.enums.*;
import com.clickkaar.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
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
  private final GalleryImageRepository galleryImageRepository;
  private final StaticContentRepository staticContentRepository;
  private final BookingRepository bookingRepository;
  private final PaymentRepository paymentRepository;
  private final WishlistRepository wishlistRepository;
  private final BookingNoteRepository bookingNoteRepository;
  private final PasswordEncoder passwordEncoder;

  @Bean
  @ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = true)
  CommandLineRunner seedClickkaarData() {
    return args -> {
      Role customer = roleRepository.findByName(RoleName.CUSTOMER)
          .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.CUSTOMER).build()));
      roleRepository.findByName(RoleName.EMPLOYEE)
          .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.EMPLOYEE).build()));
      Role manager = roleRepository.findByName(RoleName.MANAGER)
          .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.MANAGER).build()));
      Role inventoryStaff = roleRepository.findByName(RoleName.INVENTORY_STAFF)
          .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.INVENTORY_STAFF).build()));
      Role contentEditor = roleRepository.findByName(RoleName.CONTENT_EDITOR)
          .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.CONTENT_EDITOR).build()));
      Role admin = roleRepository.findByName(RoleName.ADMIN)
          .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.ADMIN).build()));

      User adminUser = seedUser("Clickkaar Admin", "admin@clickkaar.com", "9999999999", Set.of(admin), true);
      seedUser("Clickkaar Manager", "manager@clickkaar.com", "9999999991", Set.of(manager), true);
      seedUser("Clickkaar Inventory Staff", "inventory@clickkaar.com", "9999999992", Set.of(inventoryStaff), true);
      seedUser("Clickkaar Content Editor", "content@clickkaar.com", "9999999993", Set.of(contentEditor), true);
      seedCategories();
      seedProducts();
      seedBlogs();
      seedFaqs();
      seedGalleryImages();
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
    seedFaq("What photography equipment does Click-Kaar rent in Pune?", "Click-Kaar rents a wide range of premium photography and videography equipment in Pune, including DSLR and mirrorless cameras, prime and zoom lenses, professional lighting, and audio gear. We feature top-tier production gear from brands like Canon, Sony, Nikon, and Godox.", 1);
    seedFaq("How do I book a camera rental with Click-Kaar?", "You can book a camera rental with Click-Kaar through a simple four-step process on our website. First, select your rental dates to view live stock in Pune. Second, add your required cameras, lenses, and lighting to your cart. Third, confirm your booking and pricing. Finally, pick up your gear with our local support team.", 2);
    seedFaq("Does Click-Kaar offer pre-packaged equipment kits for events?", "Yes, Click-Kaar offers specialized, shoot-ready gear kits tailored for specific production needs. We currently offer a complete Wedding Photography Kit which include camera bodies, lenses, and necessary support gear.", 3);
    seedFaq("Are the rental cameras and lenses tested before pickup?", "Yes, every rental DSLR, mirrorless camera, premium lens, and lighting kit is strictly tested by Click-Kaar before your shoot. We ensure all verified equipment is in perfect working condition so you can shoot with complete confidence.", 4);
    seedFaq("What happens if the rented camera equipment gets damaged?", "If equipment is damaged during your rental period, you are responsible for the repair costs or the depreciated replacement value of the item if it is beyond repair. We provide live technical support during your shoot for immediate camera troubleshooting to help prevent operational issues.", 5);
    seedFaq("Do I need to pay a security deposit to rent equipment?", "Yes, Click-Kaar requires a refundable security deposit for all camera, lens, and lighting rentals in Pune. The exact deposit amount depends on the total market value of the equipment you are renting and is fully refunded to you when the gear is returned in working condition.", 6);
    seedFaq("What documents are required for ID verification?", "To rent equipment from Click-Kaar, you must provide a valid government-issued photo ID and a proof of local address in Pune. We accept original documents such as an Aadhaar Card, Passport, or Voter ID, which our team will verify before your first rental order is approved.", 7);
    seedFaq("Can I extend my camera rental period after picking up the gear?", "Yes, you can extend your rental duration by contacting the Click-Kaar support team at least 24 hours before your original return deadline. Extensions are completely subject to live equipment availability and will be billed at our standard daily rental rates.", 8);
    seedFaq("What is your cancellation and refund policy?", "Click-Kaar offers a full refund for rental bookings canceled at least 48 hours prior to your scheduled pickup time. If you cancel your booking within 48 hours of the scheduled pickup, the cancellation is subject to a 50% deduction of the total rental amount.", 9);
    seedFaq("Does Click-Kaar provide equipment delivery directly to my shoot location?", "Currently, Click-Kaar requires creators to pick up and return their rented photography equipment directly at our Pune facility. This ensures you have the opportunity to physically inspect and test the cameras, lenses, and audio gear with our technical support team before taking them to your set.", 10);
    seedFaq("Can I walk into the Click-Kaar Pune store to rent a camera today?", "Yes, walk-ins are welcome at our Pune Office, but we strongly recommend booking online 24 to 48 hours in advance to guarantee live equipment availability, as premium gear like the Sony A7 M5 often books out.", 11);
    seedFaq("How much advance notice is required to book a camera rental?", "For first-time renters requiring ID verification, we recommend booking at least 48 hours in advance. Returning Click-Kaar customers can book equipment up to 24 hours prior to their desired pickup date.", 12);
    seedFaq("Do you provide home delivery for camera rentals in Pune?", "Click-Kaar primarily operates on a store pickup model to allow for in-person gear testing. However, custom delivery and pickup in Pune may be arranged for high-volume production orders upon special request.", 13);
    seedFaq("What are the pickup and drop-off timings for rental gear?", "Rental gear can be picked up and dropped off during our standard store hours. A one-day rental is calculated as a 24-hour period from the time of your scheduled pickup.", 14);
    seedFaq("Can I rent a camera for a trip outside of Pune?", "Yes, you can rent equipment for out-of-station shoots or travel. You simply rent the gear for the total duration of your trip, ensuring it is picked up and returned to our Pune facility.", 15);
    seedFaq("Why do you require document verification for a camera rental?", "We require ID verification to prevent identity theft and ensure the safety of our premium photography equipment. This is a standard, one-time security process for all first-time renters.", 16);
    seedFaq("Is a post-dated cheque required as a security deposit?", "Depending on the total value of the gear rented, we may require a security cheque or a refundable UPI/Card deposit. The specific deposit requirement will be clearly displayed in your cart before booking.", 17);
    seedFaq("How long does it take to get my security deposit refunded?", "Your security deposit is refunded immediately upon the safe return and technical inspection of the rented equipment at our Pune store. Bank transfers may take 24 to 48 hours to reflect in your account.", 18);
    seedFaq("Can a friend pick up my rental gear on my behalf?", "No, the person whose name and verified ID are on the booking must be present to pick up the equipment, sign the rental agreement, and complete the gear inspection.", 19);
    seedFaq("Do the cameras come with fully charged batteries and memory cards?", "Yes, every Click-Kaar camera rental includes one fully charged battery, a standard memory card, a battery charger, and a protective carrying case. Extra batteries and high-capacity cards can be added to your cart.", 20);
    seedFaq("Is the rented camera equipment sanitized and cleaned?", "Yes, our technical team professionally cleans the camera sensors, sanitizes the camera bodies, and inspects all lenses for dust and fungus before every single rental dispatch.", 21);
    seedFaq("What should I do if a rented camera stops working during my shoot?", "If you experience technical issues, immediately call our local Pune support team. We provide live troubleshooting and, if a mechanical failure occurs (not caused by physical damage), we will attempt to provide a replacement if stock is available.", 22);
    seedFaq("Can I rent just a camera body if I already own lenses?", "Yes, you can rent individual camera bodies, specific prime or zoom lenses, or audio equipment independently. You do not have to rent a full kit.", 23);
    seedFaq("Do you rent specialized gear like gimbals and drones?", "Yes, our inventory includes professional stabilization gear like DJI gimbals. Currently, we focus on ground-based production gear and do not offer aerial drone rentals.", 24);
    seedFaq("What is considered \"damage\" versus \"normal wear and tear\"?", "Minor scuff marks on a lens hood or camera barrel are considered normal use. However, scratched glass, broken screens, impact damage, or water damage are considered chargeable damages.", 25);
    seedFaq("Do you offer damage waivers or equipment insurance?", "Currently, Click-Kaar does not offer in-house damage waivers. The renter assumes full financial responsibility for the equipment from the moment of pickup until it is safely returned.", 26);
    seedFaq("What happens if I return the equipment late?", "Late returns disrupt the bookings of other creators. Equipment returned past the agreed 24-hour cycle will be subject to a late fee, which is typically calculated as an additional full-day rental charge.", 27);
    seedFaq("Can I return a rental early for a partial refund?", "You may return equipment early; however, we do not provide refunds for unused rental days, as the gear was reserved for your exclusive use and made unavailable to other customers.", 28);
  }

  private void seedFaq(String question, String answer, int displayOrder) {
    faqRepository.save(Faq.builder().question(question).answer(answer).active(true).displayOrder(displayOrder).build());
  }

  private void seedGalleryImages() {
    if (galleryImageRepository.count() > 0) {
      return;
    }
    seedGalleryImage("https://images.unsplash.com/photo-1495707902641-75cac588d2e9?auto=format&fit=crop&w=900&q=80", "Camera shoot detail", true, false, 1);
    seedGalleryImage("/join-photographer.png", "Photographer creative portrait", false, true, 2);
    seedGalleryImage("https://images.unsplash.com/photo-1607462109225-6b64ae2dd3cb?auto=format&fit=crop&w=900&q=80", "Tripod equipment", false, false, 3);
    seedGalleryImage("https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=900&q=80", "Audio equipment", false, false, 4);
    seedGalleryImage("https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80", "Studio interior", true, false, 5);
    seedGalleryImage("https://images.unsplash.com/photo-1516724562728-afc824a36e84?auto=format&fit=crop&w=900&q=80", "Outdoor creator kit", false, false, 6);
  }

  private void seedGalleryImage(String imageUrl, String altText, boolean wide, boolean tall, int displayOrder) {
    galleryImageRepository.save(GalleryImage.builder()
        .imageUrl(imageUrl)
        .altText(altText)
        .wide(wide)
        .tall(tall)
        .active(true)
        .displayOrder(displayOrder)
        .build());
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
    LocalDate startDate = LocalDate.parse(start);
    LocalDate endDate = LocalDate.parse(end);
    if (bookingRepository.existsByBookingNumber(bookingNumber)
        || bookingRepository.existsByCustomerIdAndRentalStartDateAndRentalEndDate(customer.getId(), startDate, endDate)) {
      return;
    }
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
    bookingNoteRepository.save(BookingNote.builder()
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
