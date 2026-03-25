#!/bin/bash
# Script para actualizar las reglas de Firestore
# Ejecutar este script desde tu máquina local con Firebase CLI instalado

echo "🔥 Actualizando reglas de Firestore para Academic Tracker..."
echo ""

# Verificar si Firebase CLI está instalado
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI no está instalado."
    echo "Instálalo con: npm install -g firebase-tools"
    exit 1
fi

# Verificar si está autenticado
echo "Verificando autenticación..."
firebase projects:list > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ No estás autenticado en Firebase."
    echo "Ejecuta: firebase login"
    exit 1
fi

# Desplegar reglas
echo "Desplegando reglas de Firestore..."
firebase deploy --only firestore:rules --project academic-tracker-qeoxi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ¡Reglas actualizadas correctamente!"
    echo "Las colecciones 'absences' y 'tracking_logs' ahora tienen permisos de lectura/escritura."
else
    echo ""
    echo "❌ Error al desplegar las reglas."
fi
