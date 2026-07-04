# Deploy Clickkaar Backend to Google Cloud Run

This backend is containerized for Cloud Run with:

- `/cloudbuild.yaml` for repo-root GitHub/Cloud Build triggers
- `Dockerfile` for a Java 17 Spring Boot image
- `application-cloud.yml` for production environment variables
- `backend/cloudbuild.yaml` for manual deploys from the backend folder
- `/api/health` as a public health endpoint

## 1. Choose Google Cloud Values

Use these examples or replace them:

```powershell
$PROJECT_ID = "your-google-cloud-project-id"
$REGION = "asia-south1"
$REPOSITORY = "clickkaar"
$SERVICE = "clickkaar-backend"
```

## 2. Enable APIs

```powershell
gcloud config set project $PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
```

## 3. Create Artifact Registry Repository

```powershell
gcloud artifacts repositories create $REPOSITORY --repository-format=docker --location=$REGION --description="Clickkaar containers"
```

If it already exists, this command will fail harmlessly; continue.

## 4. Store Required Secrets

Use your real database values here. For Aiven MySQL, `DB_URL` should look like:

```text
jdbc:mysql://HOST:PORT/defaultdb?ssl-mode=REQUIRED
```

Create secrets:

```powershell
echo "jdbc:mysql://HOST:PORT/defaultdb?ssl-mode=REQUIRED" | gcloud secrets create clickkaar-db-url --data-file=-
echo "avnadmin" | gcloud secrets create clickkaar-db-username --data-file=-
echo "your-db-password" | gcloud secrets create clickkaar-db-password --data-file=-
echo "replace-with-a-long-random-production-jwt-secret" | gcloud secrets create clickkaar-jwt-secret --data-file=-
```

To update an existing secret:

```powershell
echo "new-value" | gcloud secrets versions add clickkaar-db-password --data-file=-
```

## 5. Grant Deployment Permissions

```powershell
$PROJECT_NUMBER = gcloud projects describe $PROJECT_ID --format="value(projectNumber)"
$CLOUD_BUILD_SA = "$PROJECT_NUMBER@cloudbuild.gserviceaccount.com"
$CLOUD_RUN_RUNTIME_SA = "$PROJECT_NUMBER-compute@developer.gserviceaccount.com"

gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$CLOUD_BUILD_SA" --role="roles/run.admin"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$CLOUD_BUILD_SA" --role="roles/artifactregistry.writer"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$CLOUD_BUILD_SA" --role="roles/iam.serviceAccountUser"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$CLOUD_RUN_RUNTIME_SA" --role="roles/secretmanager.secretAccessor"
```

If your Cloud Build project uses a different build service account, grant these same Cloud Build roles to the service account shown in the Cloud Build error.

## 6. Deploy

From the backend folder:

```powershell
cd backend
gcloud builds submit --config cloudbuild.yaml --substitutions _REGION=$REGION,_REPOSITORY=$REPOSITORY,_SERVICE=$SERVICE,_CORS_ALLOWED_ORIGINS=https://clickkaar.com,_FRONTEND_LOGIN_URL=https://clickkaar.com/login
```

If you deploy from a GitHub trigger at the repository root, configure the trigger to use `/cloudbuild.yaml`. That file builds `backend/Dockerfile`; otherwise Google buildpacks may detect the Angular frontend and deploy the wrong container.

## 7. Verify

After deploy finishes, Cloud Run prints the service URL.

```powershell
curl.exe https://YOUR-CLOUD-RUN-URL/api/health
curl.exe https://YOUR-CLOUD-RUN-URL/api/products
```

## Notes

- The app reads Cloud Run's `PORT` environment variable through `server.port`.
- If the database blocks Cloud Run outbound IPs, startup will fail with a JDBC communications error. For Aiven, update trusted sources or use a static outbound IP through VPC/NAT.
- Add your deployed frontend domain to `_CORS_ALLOWED_ORIGINS`; multiple origins are comma-separated.
