package com.clickkaar.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSchemaFixer implements ApplicationRunner {
  private final DataSource dataSource;
  private final JdbcTemplate jdbcTemplate;

  @Override
  public void run(ApplicationArguments args) {
    widenBookingStatusColumn();
  }

  private void widenBookingStatusColumn() {
    try (Connection connection = dataSource.getConnection()) {
      DatabaseMetaData metaData = connection.getMetaData();
      String databaseName = metaData.getDatabaseProductName().toLowerCase();
      if (!databaseName.contains("mysql") && !databaseName.contains("mariadb")) {
        return;
      }

      jdbcTemplate.execute("alter table bookings modify status varchar(32) not null");
      log.info("Ensured bookings.status can store all booking statuses");
    } catch (Exception exception) {
      log.warn("Unable to widen bookings.status column automatically", exception);
    }
  }
}
