#!/bin/bash
set -e

echo "📦 Preparando deploy a Cloud Run..."
cd /workspaces/AcTR-app

echo "🔐 Configurando proyecto GCP..."
gcloud config set project academic-tracker-qeoxi

echo "🚀 Desplegando backend-service..."
gcloud run deploy backend-service \
  --source=cloud-run-ai-service-backed \
  --region=us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GCP_PROJECT_ID=academic-tracker-qeoxi,GOOGLE_AI_API_KEY=AIzaSyDEpQ7ycT3Adc3S3I98v0w4ejyv8aTht_4" \
  --quiet

echo ""
echo "✅ ¡Deploy completado exitosamente!"
echo "🎉 Los endpoints están listos para usar"
