package com.clickkaar.config;

import com.clickkaar.entity.Role;
import com.clickkaar.enums.RoleName;
import com.clickkaar.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class RoleInitializer implements ApplicationRunner {
  private final RoleRepository roleRepository;

  @Override
  @Transactional
  public void run(ApplicationArguments args) {
    for (RoleName roleName : RoleName.values()) {
      roleRepository.findByName(roleName)
          .orElseGet(() -> roleRepository.save(Role.builder().name(roleName).build()));
    }
  }
}
