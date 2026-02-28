#!/bin/bash

# Script para desplegar el servicio IA en Cloud Run usando Secret Manager
# Uso: ./deploy-ai-backend.sh

set -e

PROJECT_ID="academic-tracker-qeoxi"
REGION="us-central1"
SERVICE_NAME="ai-report-service"
SECRET_NAME="GOOGLE_AI_API_KEY"

echo "🚀 Iniciando despliegue de servicio IA en Cloud Run (usando Secret Manager)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Proyecto: $PROJECT_ID"
echo "Región: $REGION"
echo "Servicio: $SERVICE_NAME"
echo "Secreto: $SECRET_NAME"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Ejecutar el despliegue
gcloud run deploy "$SERVICE_NAME" \
  --source=cloud-run-ai-service-backed \
  --region="$REGION" \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars="GCP_PROJECT_ID=$PROJECT_ID" \
  --set-secrets="GOOGLE_AI_API_KEY=$SECRET_NAME:latest" \
  --service-account="cloud-run-ai-invoker@${PROJECT_ID}.iam.gserviceaccount.com" \
  --memory=512Mi \
  --cpu=1 \
  --timeout=120 \
  --max-instances=10 \
  --quiet

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Despliegue completado exitosamente"
    echo ""
    echo "📋 Información del servicio:"
    gcloud run services describe "$SERVICE_NAME" \
      --region="$REGION" \
      --format='value(status.url)'
    echo ""
    echo "📊 Para monitorear los logs:"
    echo "gcloud run logs read $SERVICE_NAME --region=$REGION --limit=50"
else
    echo "❌ Error durante el despliegue"
    exit 1
fi
