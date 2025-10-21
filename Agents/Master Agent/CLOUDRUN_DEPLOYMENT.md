# Cloud Run Deployment Guide

## Overview
This guide explains how to deploy the Master Agent to Google Cloud Run.

## Prerequisites
- Google Cloud SDK (gcloud) installed
- Authenticated with: `gcloud auth login`
- Service account `master-agent-sa@medassureaiproject.iam.gserviceaccount.com` exists
- **Secret `master-agent-key-json-secret` exists in Google Secret Manager** ✅
- Required APIs enabled (deployment script will enable them)

## Current Configuration

### Environment Variables (in .env)
```
GOOGLE_CLOUD_PROJECT=medassureaiproject
GOOGLE_CLOUD_LOCATION=us-central1
Vertex_AI_MODEL_Name=gemini-2.0-flash
GOOGLE_APPLICATION_CREDENTIALS=master-agent-key.json  # For local dev only
PORT=8080
```

### Service Account Path
**Local Development**: `GOOGLE_APPLICATION_CREDENTIALS=master-agent-key.json`
- ✅ This is correct for local development (relative path)
- ✅ The key file exists in the same directory as the code

**Cloud Run Deployment**: Uses **Google Secret Manager**
- ✅ Secret `master-agent-key-json-secret` contains the service account key
- ✅ Cloud Run mounts the secret as a file at `/secrets/master-agent-key.json`
- ✅ Environment variable `GOOGLE_APPLICATION_CREDENTIALS=/secrets/master-agent-key.json`
- ✅ The deployment script grants the service account access to the secret

## Deployment Steps

### Option 1: Automated Deployment (Recommended)

Simply run the deployment script:

```powershell
cd "D:\Google Projects\Final Sample\MedAssure AI\Agents\Master Agent"
.\deploy-cloudrun.ps1
```

This script will:
1. Set the GCloud project
2. Enable required APIs (Cloud Run, Cloud Build, Artifact Registry, Vertex AI, **Secret Manager**)
3. Grant necessary permissions to the service account (Vertex AI + **Secret access**)
4. Build the Docker image
5. Deploy to Cloud Run with **secret mounted from Secret Manager**
6. Display the service URL

### Option 2: Manual Deployment

If you prefer to deploy manually:

```powershell
# 1. Set project
gcloud config set project medassureaiproject

# 2. Enable APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable secretmanager.googleapis.com

# 3. Grant permissions
gcloud projects add-iam-policy-binding medassureaiproject `
    --member="serviceAccount:master-agent-sa@medassureaiproject.iam.gserviceaccount.com" `
    --role="roles/aiplatform.user"

gcloud secrets add-iam-policy-binding master-agent-key-json-secret `
    --member="serviceAccount:master-agent-sa@medassureaiproject.iam.gserviceaccount.com" `
    --role="roles/secretmanager.secretAccessor" `
    --project=medassureaiproject

# 4. Deploy
gcloud run deploy master-agent `
    --source . `
    --platform managed `
    --region us-central1 `
    --allow-unauthenticated `
    --service-account master-agent-sa@medassureaiproject.iam.gserviceaccount.com `
    --set-env-vars "GOOGLE_CLOUD_PROJECT=medassureaiproject,GOOGLE_CLOUD_LOCATION=us-central1,GOOGLE_GENAI_USE_VERTEXAI=true,Vertex_AI_MODEL_Name=gemini-2.0-flash,GOOGLE_APPLICATION_CREDENTIALS=/secrets/master-agent-key.json" `
    --set-secrets="/secrets/master-agent-key.json=master-agent-key-json-secret:latest" `
    --memory 512Mi `
    --cpu 1 `
    --timeout 300 `
    --max-instances 10 `
    --port 8080
```

## Testing After Deployment

Once deployed, you'll get a URL like: `https://master-agent-xxxxx-uc.a.run.app`

Test the health check:
```powershell
Invoke-RestMethod -Uri "https://master-agent-xxxxx-uc.a.run.app/" -Method Get
```

Test with a prompt:
```powershell
Invoke-RestMethod -Uri "https://master-agent-xxxxx-uc.a.run.app/" -Method Post `
    -Body '{"prompt":"What is the capital of India?"}' `
    -ContentType "application/json"
```

## Authentication Notes

### Using Google Secret Manager for Service Account Key

Cloud Run will mount the secret from Google Secret Manager:
- Secret name: `master-agent-key-json-secret`
- Mounted at: `/secrets/master-agent-key.json`
- Environment variable: `GOOGLE_APPLICATION_CREDENTIALS=/secrets/master-agent-key.json`
- This is **more secure** than embedding keys in Docker images

### Local vs Cloud Run

| Aspect | Local Development | Cloud Run |
|--------|------------------|-----------|
| Auth Method | Service Account Key File | Secret Manager Mount |
| Key File Location | `./master-agent-key.json` | `/secrets/master-agent-key.json` |
| Env Var | `GOOGLE_APPLICATION_CREDENTIALS=master-agent-key.json` | `GOOGLE_APPLICATION_CREDENTIALS=/secrets/master-agent-key.json` |
| Service Account | master-agent-sa | master-agent-sa |
| Secret Access | N/A | `roles/secretmanager.secretAccessor` |

## Configuration Details

### Cloud Run Settings
- **Memory**: 512Mi (can be increased if needed)
- **CPU**: 1 (can be increased for better performance)
- **Timeout**: 300 seconds (5 minutes)
- **Max Instances**: 10 (for auto-scaling)
- **Port**: 8080 (matches the agent)
- **Authentication**: Public (allow-unauthenticated)

### Environment Variables Set by Deployment
The deployment script sets these environment variables in Cloud Run:
- `GOOGLE_CLOUD_PROJECT=medassureaiproject`
- `GOOGLE_CLOUD_LOCATION=us-central1`
- `GOOGLE_GENAI_USE_VERTEXAI=true`
- `Vertex_AI_MODEL_Name=gemini-2.0-flash`
- `GOOGLE_APPLICATION_CREDENTIALS=/secrets/master-agent-key.json` ✅

And mounts the secret:
- Secret: `master-agent-key-json-secret:latest` → `/secrets/master-agent-key.json`

## Troubleshooting

### Build Fails
- Check that `requirements.txt` is complete
- Verify all files are present
- Check `.dockerignore` isn't excluding needed files

### Deployment Fails
- Ensure service account exists: `gcloud iam service-accounts list`
- Check API enablement: `gcloud services list --enabled`
- Verify permissions: Service account needs `roles/aiplatform.user`

### Agent Returns Errors
- Check logs: `gcloud run logs read master-agent --region us-central1`
- Verify environment variables are set correctly
- Ensure secret is mounted: Check for `/secrets/master-agent-key.json`
- Verify service account has `secretmanager.secretAccessor` role
- Test the model name is valid

### 404 Model Not Found
- Ensure `Vertex_AI_MODEL_Name=gemini-2.0-flash` is correct
- Try `gemini-1.5-flash` or `gemini-1.5-pro` if issues persist

## Monitoring

View logs:
```powershell
gcloud run logs read master-agent --region us-central1 --limit 50
```

Stream logs:
```powershell
gcloud run logs tail master-agent --region us-central1
```

## Updating the Deployment

To update the service:
```powershell
# Just run the deployment script again
.\deploy-cloudrun.ps1
```

Or manually:
```powershell
gcloud run deploy master-agent --source . --region us-central1
```

## Cleanup

To delete the Cloud Run service:
```powershell
gcloud run services delete master-agent --region us-central1
```

## Summary

✅ **Path `master-agent-key.json` is CORRECT for local development**
✅ **For Cloud Run, the secret `master-agent-key-json-secret` is mounted from Secret Manager**
✅ **Secret is mounted at `/secrets/master-agent-key.json` in Cloud Run**
✅ **Deployment script handles all the setup automatically**

Just run `.\deploy-cloudrun.ps1` and you're done! 🚀
