package com.clickkaar.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "admin_notes")
public class AdminNote extends AuditableEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional = false)
  private Booking booking;

  @ManyToOne(optional = false)
  private User admin;

  @Column(columnDefinition = "TEXT")
  private String note;
}
