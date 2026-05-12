#!/bin/bash
set -e

PROJECT_ID="academic-tracker-qeoxi"
REGION="us-central1"
SERVICE_NAME="backend-service"
SECRET_NAME="GOOGLE_AI_API_KEY"

echo "Desplegando backend a Cloud Run..."
cd /workspaces/AcTR-app

gcloud config set project "$PROJECT_ID"

echo "Iniciar deploy..."
gcloud run deploy "$SERVICE_NAME" \
  --source=cloud-run-ai-service-backed \
  --region="$REGION" \
  --allow-unauthenticated \
  --set-env-vars="GCP_PROJECT_ID=$PROJECT_ID" \
  --set-secrets="GOOGLE_AI_API_KEY=$SECRET_NAME:latest" \
  --quiet

echo "✅ Deploy completado exitosamente"
