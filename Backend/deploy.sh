#!/bin/bash

# Deploy Backend to Google Cloud Run
# Usage: ./deploy.sh [PROJECT_ID] [REGION]

PROJECT_ID=${1:-"your-project-id"}
REGION=${2:-"us-central1"}
SERVICE_NAME="medassure-backend"

echo "Deploying MedAssure AI Backend to Cloud Run..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"

# Build and deploy
gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --project $PROJECT_ID \
  --allow-unauthenticated \
  --port 8083 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "AGENTS_API_URL=https://your-agents-service-url.run.app/query,AGENTS_API_TIMEOUT=60"

echo "Deployment complete!"
echo "Service URL: https://$SERVICE_NAME-$REGION.run.app"