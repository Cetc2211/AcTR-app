#!/bin/bash

# Script para desplegar el servicio IA en Cloud Run
# Uso: ./deploy-ai-backend.sh <API_KEY>
# Ejemplo: ./deploy-ai-backend.sh "AIzaSy..."

set -e

# Validar que la API key fue proporcionada
if [ -z "$1" ]; then
    echo "❌ Error: Debes proporcionar la API key de Google AI como argumento"
    echo "Uso: ./deploy-ai-backend.sh <API_KEY>"
    exit 1
fi

API_KEY="$1"
PROJECT_ID="academic-tracker-qeoxi"
REGION="us-central1"
SERVICE_NAME="ai-report-service"

echo "🚀 Iniciando despliegue de servicio IA en Cloud Run"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Proyecto: $PROJECT_ID"
echo "Región: $REGION"
echo "Servicio: $SERVICE_NAME"
echo "API Key: ${API_KEY:0:10}...${API_KEY: -10}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Ejecutar el despliegue
gcloud run deploy "$SERVICE_NAME" \
  --source=cloud-run-ai-service-backed \
  --region="$REGION" \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_AI_API_KEY=$API_KEY,GCP_PROJECT_ID=$PROJECT_ID" \
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
