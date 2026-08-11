package com.clickkaar.repository;

import com.clickkaar.entity.Kit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface KitRepository extends JpaRepository<Kit, Long> {
  List<Kit> findAllByOrderByCreatedAtDesc();
  List<Kit> findByActiveTrueOrderByCreatedAtDesc();
}