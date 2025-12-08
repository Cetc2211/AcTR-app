#!/bin/bash

# Script de verificación rápida antes del despliegue
# Uso: bash verify-before-deploy.sh

echo "🔍 Verificación Pre-Despliegue - AcTR IA Backend v2.3"
echo "════════════════════════════════════════════════════════"

# 1. Verificar main.py
echo ""
echo "✓ Verificando main.py..."
if grep -q "sys.exit(1)" cloud-run-ai-service-backed/main.py; then
    echo "  ✅ Falla ruidosa (sys.exit) configurada"
else
    echo "  ❌ sys.exit(1) no encontrado"
    exit 1
fi

if grep -q "model_initialized = True" cloud-run-ai-service-backed/main.py; then
    echo "  ✅ model_initialized flag presente"
else
    echo "  ❌ model_initialized flag no encontrado"
    exit 1
fi

if grep -q "version.*2.2" cloud-run-ai-service-backed/main.py; then
    echo "  ✅ Versión 2.2 en health check"
else
    echo "  ❌ Versión 2.2 no encontrada"
    exit 1
fi

# 2. Verificar Dockerfile
echo ""
echo "✓ Verificando Dockerfile..."
if grep -q "EXPOSE 8080" cloud-run-ai-service-backed/Dockerfile; then
    echo "  ✅ EXPOSE 8080 presente"
else
    echo "  ❌ EXPOSE 8080 no encontrado"
    exit 1
fi

if grep -q "0.0.0.0:8080" cloud-run-ai-service-backed/Dockerfile; then
    echo "  ✅ Gunicorn configurado en 0.0.0.0:8080"
else
    echo "  ❌ Gunicorn no configurado correctamente"
    exit 1
fi

# 3. Verificar requirements.txt
echo ""
echo "✓ Verificando requirements.txt..."
if grep -q "requests==" cloud-run-ai-service-backed/requirements.txt; then
    echo "  ✅ requests presente (para REST API)"
else
    echo "  ❌ requests no encontrado"
    exit 1
fi

if grep -q "google-generativeai" cloud-run-ai-service-backed/requirements.txt; then
    echo "  ❌ google-generativeai debería estar removido"
    exit 1
else
    echo "  ✅ google-generativeai removido (correcto)"
fi

# 4. Verificar que model_initialized está siendo validado en endpoints
echo ""
echo "✓ Verificando endpoints..."
if grep -q "model_initialized" cloud-run-ai-service-backed/main.py | grep -q "generate-group-report"; then
    echo "  ✅ generate-group-report valida model_initialized"
else
    echo "  ⚠️  Verificación de validación en endpoints"
fi

# 5. Variables de entorno
echo ""
echo "✓ Verificando configuración..."
if [ -z "$GOOGLE_AI_API_KEY" ]; then
    echo "  ⚠️  GOOGLE_AI_API_KEY no está en el entorno local"
    echo "  (Se configurará en Cloud Run durante el despliegue)"
else
    echo "  ✅ GOOGLE_AI_API_KEY disponible (primeros 10 chars: ${GOOGLE_AI_API_KEY:0:10}...)"
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo "✅ Todas las verificaciones pasaron. Listo para despliegue."
echo ""
echo "Próximo paso - Ejecuta:"
echo ""
echo "  gcloud run deploy ai-report-service \\"
echo "    --source=cloud-run-ai-service-backed \\"
echo "    --region=us-central1 \\"
echo "    --platform=managed \\"
echo "    --allow-unauthenticated \\"
echo "    --set-env-vars=\"GOOGLE_AI_API_KEY=YOUR_API_KEY,GCP_PROJECT_ID=academic-tracker-qeoxi\" \\"
echo "    --service-account=cloud-run-ai-invoker@academic-tracker-qeoxi.iam.gserviceaccount.com \\"
echo "    --project=academic-tracker-qeoxi"
echo ""
echo "⚠️  No olvides reemplazar YOUR_API_KEY con tu clave real"
echo ""
