# Clickkaar Backend

Spring Boot 3 backend API for Clickkaar, a photography and videography equipment rental platform.

## Stack

- Java 17+
- Spring Boot 3
- Spring Web, Spring Data JPA, Spring Security
- JWT auth with BCrypt password hashing
- MySQL by default, PostgreSQL driver included
- Lombok, Bean Validation
- Swagger/OpenAPI
- Razorpay and Cloudinary dependencies included for production integrations

## Run Locally

1. Create a MySQL database or let Hibernate create it from the JDBC URL:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS clickkaar;"
```

2. Set environment variables if your database credentials differ:

```bash
set DB_USERNAME=root
set DB_PASSWORD=password
set JWT_SECRET=replace-this-with-a-long-production-secret
```

3. Start the backend:

```bash
mvn spring-boot:run
```

Swagger UI: `http://localhost:8080/swagger-ui.html`

## Seed Accounts

- Admin email: `admin@clickkaar.com`
- Admin password: `Admin@123`

## Implemented First Pass

- Project structure under `com.clickkaar`
- Entities, enums, repositories for all requested core models
- Customer register/login
- Admin login
- JWT security filter
- BCrypt password hashing
- Role-based endpoint protection
- Product catalogue CRUD/search/category routes
- Booking create/list/status routes with date-overlap protection
- Payment order, verification, and refund request routes
- Blog CRUD routes
- Contact, FAQ, Terms, Privacy content routes
- Swagger/OpenAPI
- Seed data for roles, admin, categories, products, FAQ, static content

## External Integrations

Razorpay, Cloudinary, SMS OTP, and email are prepared as integration points. Live provider keys should be supplied through environment variables. The API never stores payment card details.
