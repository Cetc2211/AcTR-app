#!/bin/bash
set -e

echo "Desplegando backend a Cloud Run..."
cd /workspaces/AcTR-app

gcloud config set project academic-tracker-qeoxi

echo "Iniciar deploy..."
gcloud run deploy backend-service \
  --source=cloud-run-ai-service-backed \
  --region=us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GCP_PROJECT_ID=academic-tracker-qeoxi,GOOGLE_AI_API_KEY=AIzaSyDEpQ7ycT3Adc3S3I98v0w4ejyv8aTht_4" \
  --quiet

echo "✅ Deploy completado exitosamente"
