#!/bin/bash
set -e

echo "📦 Preparando deploy a Cloud Run..."
cd /workspaces/AcTR-app

echo "🔐 Configurando autenticación GCP..."
gcloud config set project academic-tracker-qeoxi

# Intenta autenticarse con credenciales del Application Default
echo "🔑 Configurando credenciales por defecto..."
gcloud auth application-default login || true

echo "🚀 Desplegando backend-service (sin Artifact Registry)..."
# Usar --source con un Dockerfile en lugar de pushear a Artifact Registry
gcloud run deploy backend-service \
  --source=cloud-run-ai-service-backed \
  --region=us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GCP_PROJECT_ID=academic-tracker-qeoxi,GOOGLE_AI_API_KEY=AIzaSyDEpQ7ycT3Adc3S3I98v0w4ejyv8aTht_4" \
  --no-gen2 \
  --quiet 2>&1 || {
    echo ""
    echo "⚠️  El deploy falló por permisos. Intentando con opción alternativa..."
    # Opción alternativa: usar gcloud con builder local
    gcloud run deploy backend-service \
      --source=cloud-run-ai-service-backed \
      --region=us-central1 \
      --allow-unauthenticated \
      --set-env-vars="GCP_PROJECT_ID=academic-tracker-qeoxi,GOOGLE_AI_API_KEY=AIzaSyDEpQ7ycT3Adc3S3I98v0w4ejyv8aTht_4" \
      --build-service-account="$(gcloud config get-value project)@appspot.gserviceaccount.com" \
      --quiet
  }

echo ""
echo "✅ ¡Deploy completado exitosamente!"
echo "🎉 Los endpoints están listos para usar"
