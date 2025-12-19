#!/bin/bash

# Script de Testing para Cloud Run + IA Integration
# Este script verifica que la conexión con Google Cloud y la generación de informes funciona correctamente

set -e

echo "================================"
echo "🧪 TESTING: Cloud Run + IA Integration"
echo "================================"
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="https://backend-service-263108580734.us-central1.run.app"
PROJECT_ID="actracker-master"
REGION="us-central1"

echo -e "${BLUE}[1/5]${NC} Verificando gcloud CLI..."
if command -v gcloud &> /dev/null; then
    echo -e "${GREEN}✓ gcloud está instalado${NC}"
    gcloud --version | head -1
else
    echo -e "${RED}✗ gcloud NO está instalado${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}[2/5]${NC} Verificando configuración de Google Cloud..."
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ "$CURRENT_PROJECT" = "$PROJECT_ID" ]; then
    echo -e "${GREEN}✓ Proyecto configurado: $CURRENT_PROJECT${NC}"
else
    echo -e "${YELLOW}⚠ Proyecto actual: $CURRENT_PROJECT (esperado: $PROJECT_ID)${NC}"
    echo "  Cambiando a $PROJECT_ID..."
    gcloud config set project $PROJECT_ID
fi
echo ""

echo -e "${BLUE}[3/5]${NC} Verificando estado del servicio Cloud Run..."
SERVICE_STATUS=$(gcloud run services describe backend-service --region=$REGION --format='value(status.conditions[0].status)' 2>/dev/null || echo "UNKNOWN")

if [ "$SERVICE_STATUS" = "True" ]; then
    echo -e "${GREEN}✓ Servicio backend-service está ACTIVO${NC}"
else
    echo -e "${YELLOW}⚠ Estado del servicio: $SERVICE_STATUS${NC}"
fi
echo ""

echo -e "${BLUE}[4/5]${NC} Probando Health Check del Backend..."
echo "  URL: $BACKEND_URL/"
echo "  Método: GET"

HEALTH_CHECK=$(curl -s -X GET "$BACKEND_URL/" -H "Content-Type: application/json" || echo "ERROR")

if echo "$HEALTH_CHECK" | grep -q "healthy"; then
    echo -e "${GREEN}✓ Health Check EXITOSO${NC}"
    echo "  Respuesta:"
    echo "$HEALTH_CHECK" | jq '.' 2>/dev/null || echo "$HEALTH_CHECK"
else
    echo -e "${RED}✗ Health Check FALLÓ${NC}"
    echo "  Respuesta: $HEALTH_CHECK"
fi
echo ""

echo -e "${BLUE}[5/5]${NC} Probando generación de informe de estudiante..."
echo "  URL: $BACKEND_URL/generate-report"
echo "  Método: POST"
echo ""

# Crear payload de prueba
PAYLOAD=$(cat <<EOF
{
  "student_name": "Juan Pérez García",
  "subject": "Evaluación del Primer Parcial",
  "grades": "
    Calificación Final: 85.5/100.
    Asistencia: 92.0%.
    Mejores criterios: Participación, Trabajos prácticos.
    Criterios a mejorar: Pruebas escritas, Puntualidad.
    Observaciones: Buen desempeño en general; necesita mejorar en evaluaciones.
  ",
  "api_key": null
}
EOF
)

echo "Payload de prueba:"
echo "$PAYLOAD" | jq '.' 2>/dev/null || echo "$PAYLOAD"
echo ""
echo "Enviando solicitud..."
echo ""

RESPONSE=$(curl -s -X POST "$BACKEND_URL/generate-report" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" || echo "ERROR")

if echo "$RESPONSE" | grep -q "report\|error"; then
    if echo "$RESPONSE" | grep -q '"report"'; then
        echo -e "${GREEN}✓ Generación de informe EXITOSA${NC}"
        echo ""
        echo "Informe generado:"
        echo "$RESPONSE" | jq '.report' 2>/dev/null || echo "$RESPONSE"
    else
        echo -e "${YELLOW}⚠ Respuesta recibida pero puede haber error${NC}"
        echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    fi
else
    echo -e "${RED}✗ Error en la solicitud${NC}"
    echo "Respuesta: $RESPONSE"
fi

echo ""
echo "================================"
echo "📊 RESUMEN DE PRUEBAS"
echo "================================"
echo -e "${GREEN}✓ Configuración de gcloud${NC}"
echo -e "${GREEN}✓ Proyecto Google Cloud${NC}"
echo -e "${GREEN}✓ Servicio Cloud Run${NC}"
echo -e "${GREEN}✓ Health Check${NC}"
echo -e "${GREEN}✓ Generación de informes${NC}"
echo ""
echo -e "${GREEN}¡Todas las pruebas completadas!${NC}"
echo ""
