#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-click-kaar-backend}"
DB_URL="jdbc:mysql://mysql-21f136f0-clickkaar.k.aivencloud.com:12863/defaultdb?ssl-mode=REQUIRED"
DB_USERNAME="avnadmin"

secret_exists() {
  gcloud secrets describe "$1" --project "$PROJECT_ID" >/dev/null 2>&1
}

put_secret() {
  local name="$1"
  local value="$2"

  if secret_exists "$name"; then
    printf '%s' "$value" | gcloud secrets versions add "$name" --project "$PROJECT_ID" --data-file=-
  else
    printf '%s' "$value" | gcloud secrets create "$name" --project "$PROJECT_ID" --replication-policy="automatic" --data-file=-
  fi
}

read -rsp "Aiven DB password: " DB_PASSWORD
printf '\n'

read -rsp "JWT secret, leave blank to generate one: " JWT_SECRET
printf '\n'

if [ -z "$JWT_SECRET" ]; then
  JWT_SECRET="$(openssl rand -base64 48)"
fi

gcloud config set project "$PROJECT_ID"

put_secret "clickkaar-db-url" "$DB_URL"
put_secret "clickkaar-db-username" "$DB_USERNAME"
put_secret "clickkaar-db-password" "$DB_PASSWORD"
put_secret "clickkaar-jwt-secret" "$JWT_SECRET"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:371334584817-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --quiet

gcloud secrets list \
  --project "$PROJECT_ID" \
  --filter='name:(clickkaar-db-url OR clickkaar-db-username OR clickkaar-db-password OR clickkaar-jwt-secret)' \
  --format='table(name)'

printf '\nSecrets are ready. Re-run the Cloud Build check.\n'
