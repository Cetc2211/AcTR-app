#!/bin/bash
set -e

PROJECT_ID="academic-tracker-qeoxi"
REGION="us-central1"
SERVICE_NAME="backend-service"
SECRET_NAME="GOOGLE_AI_API_KEY"

echo "📦 Preparando deploy a Cloud Run..."
cd /workspaces/AcTR-app

echo "🔐 Configurando autenticación GCP..."
gcloud config set project "$PROJECT_ID"

# Intenta autenticarse con credenciales del Application Default
echo "🔑 Configurando credenciales por defecto..."
gcloud auth application-default login || true

echo "🚀 Desplegando backend-service (sin Artifact Registry)..."
# Usar --source con un Dockerfile en lugar de pushear a Artifact Registry
gcloud run deploy "$SERVICE_NAME" \
  --source=cloud-run-ai-service-backed \
  --region="$REGION" \
  --allow-unauthenticated \
  --set-env-vars="GCP_PROJECT_ID=$PROJECT_ID" \
  --set-secrets="GOOGLE_AI_API_KEY=$SECRET_NAME:latest" \
  --no-gen2 \
  --quiet 2>&1 || {
    echo ""
    echo "⚠️  El deploy falló por permisos. Intentando con opción alternativa..."
    # Opción alternativa: usar gcloud con builder local
    gcloud run deploy "$SERVICE_NAME" \
      --source=cloud-run-ai-service-backed \
      --region="$REGION" \
      --allow-unauthenticated \
      --set-env-vars="GCP_PROJECT_ID=$PROJECT_ID" \
      --set-secrets="GOOGLE_AI_API_KEY=$SECRET_NAME:latest" \
      --build-service-account="$(gcloud config get-value project)@appspot.gserviceaccount.com" \
      --quiet
  }

echo ""
echo "✅ ¡Deploy completado exitosamente!"
echo "🎉 Los endpoints están listos para usar"
