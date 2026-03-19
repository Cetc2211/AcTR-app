#!/bin/bash
set -e

# Configuración
PROJECT_ID="academic-tracker-qeoxi"
SECRET_NAME="GOOGLE_AI_API_KEY"
SERVICE_ACCOUNT="cloud-run-ai-invoker@${PROJECT_ID}.iam.gserviceaccount.com"

echo "Configurando Secret Manager para la API Key..."

# Verificar si el usuario proporcionó la clave como argumento
if [ -n "$1" ]; then
    API_KEY="$1"
else
    echo -n "Introduce tu nueva GOOGLE_AI_API_KEY (el texto se ocultará): "
    read -s API_KEY
    echo ""
fi

if [ -z "$API_KEY" ]; then
    echo "❌ Error: La API Key no puede estar vacía."
    exit 1
fi

# 1. Habilitar la API de Secret Manager si no está habilitada
echo "Habilitando servicio de Secret Manager..."
gcloud services enable secretmanager.googleapis.com --project="$PROJECT_ID" || true

# 2. Crear el secreto (o crear una nueva versión si ya existe)
echo "Creando/Actualizando el secreto '$SECRET_NAME'..."
if ! gcloud secrets describe "$SECRET_NAME" --project="$PROJECT_ID" &>/dev/null; then
    gcloud secrets create "$SECRET_NAME" --replication-policy="automatic" --project="$PROJECT_ID"
fi

# Añadir la versión de la clave
echo -n "$API_KEY" | gcloud secrets versions add "$SECRET_NAME" --data-file=- --project="$PROJECT_ID"

# 3. Dar permisos a la cuenta de servicio
echo "Otorgando permisos a $SERVICE_ACCOUNT para acceder al secreto..."
gcloud secrets add-iam-policy-binding "$SECRET_NAME" \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor" \
    --project="$PROJECT_ID"

echo "✅ Secreto configurado exitosamente."
echo "Ahora puedes ejecutar ./deploy-ai-backend.sh (ya no necesitarás pasar la clave como argumento)"
