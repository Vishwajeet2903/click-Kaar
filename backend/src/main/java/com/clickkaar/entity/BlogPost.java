package com.clickkaar.entity;

import com.clickkaar.enums.BlogStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "blog_posts")
public class BlogPost extends AuditableEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String title;

  @Column(nullable = false, unique = true)
  private String slug;

  private String coverImage;
  private String authorName;
  private LocalDate publishDate;
  private String category;
  private String tags;
  private String seoTitle;
  private String seoDescription;
  private String seoKeywords;

  @Column(columnDefinition = "TEXT")
  private String content;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private BlogStatus status;
}
