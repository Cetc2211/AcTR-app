#!/bin/bash
# Script para hacer commit de todos los cambios

echo "================================"
echo "📦 Haciendo commit de cambios..."
echo "================================"
echo ""

# Mostrar estado actual
echo "Estado actual:"
git status --short
echo ""

# Agregar todos los cambios
echo "Agregando archivos..."
git add -A

# Verificar qué se agregó
echo ""
echo "Archivos preparados para commit:"
git diff --cached --name-only
echo ""

# Hacer commit
echo "Haciendo commit..."
git commit -m "feat: Cloud Run integration, AI testing infrastructure, and documentation

Backend Changes:
- Added health check endpoint (GET /) to Cloud Run service
- Added datetime import to main.py

Frontend Changes:
- Updated generate-student-feedback-flow.ts to use environment variables
- Updated generate-group-report-analysis-flow.ts to use environment variables
- Updated settings/actions.ts to use NEXT_PUBLIC_CLOUD_RUN_ENDPOINT

Configuration:
- Created .env.local with Cloud Run endpoint
- Updated .gitignore to protect sensitive files

Testing Infrastructure:
- Created test-ai-integration.js (Node.js testing script)
- Created test-cloud-run.sh (Bash testing script)
- Created src/app/debug/test-ai/page.tsx (Visual testing interface)
- Created src/app/api/test-ai/route.ts (Server action for testing)

Documentation:
- CONFIGURACION_VARIABLES_ENTORNO.md: Environment variables guide
- DIAGNOSTICO_AI_GCP.md: Diagnostic report with 8 issues identified
- IMPLEMENTACION_CLOUD_RUN.md: Implementation details and architecture
- SETUP_CLOUD_RUN.md: Quick setup guide
- TESTING_AI_INTEGRATION.md: Testing procedures
- SEGURIDAD_RECOMENDACIONES.md: Security vulnerabilities and solutions
- EJECUTAR_PRUEBAS.md: Quick test execution guide"

# Verificar resultado
if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Commit realizado exitosamente"
    echo ""
    echo "Pushando cambios..."
    git push origin main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✓ Push completado"
        echo ""
        echo "================================"
        echo "✓ Todos los cambios enviados a GitHub"
        echo "================================"
    else
        echo ""
        echo "⚠ Error en push. Intenta manualmente:"
        echo "  git push origin main"
    fi
else
    echo ""
    echo "✗ Error en commit"
fi
