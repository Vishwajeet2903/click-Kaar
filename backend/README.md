# Clickkaar Backend

Spring Boot 3 backend API for Clickkaar, a photography and videography equipment rental platform.

## Stack

- Java 17+
- Spring Boot 3
- Spring Web, Spring Data JPA, Spring Security
- JWT auth with BCrypt password hashing
- MySQL for local development and deployment, PostgreSQL driver included
- Lombok, Bean Validation
- Swagger/OpenAPI
- Razorpay and Cloudinary dependencies included for production integrations

## Run Locally

The default Spring profile is `local`, and the local profile uses MySQL.

Create the database if it does not already exist:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS clickkaar;"
```

Set credentials if your local MySQL user is not passwordless:

```bash
set LOCAL_DB_USERNAME=root
set LOCAL_DB_PASSWORD=your_mysql_password
```

Start the backend:

```bash
mvn spring-boot:run
```

Swagger UI: `http://localhost:8080/swagger-ui.html`

## Deployment Profile

Cloud Run uses the `cloud` profile through `SPRING_PROFILES_ACTIVE=cloud` in `cloudbuild.yaml` and the Docker image. Deployment database credentials come from environment variables/secrets:

```text
DB_URL
DB_USERNAME
DB_PASSWORD
JWT_SECRET
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
```

If you want local development to use a different MySQL database, set `LOCAL_DB_URL`, `LOCAL_DB_USERNAME`, and `LOCAL_DB_PASSWORD`.

## Razorpay Payments

Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` before using the Razorpay checkout flow. The backend creates Razorpay orders from the saved booking total, verifies the Razorpay payment signature, stores the payment IDs, and marks the booking as `CONFIRMED` after successful verification.

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
