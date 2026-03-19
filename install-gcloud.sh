#!/bin/bash
set -e

echo "🔍 Verificando instalación de Google Cloud SDK..."

if ! command -v gcloud &> /dev/null; then
    echo "⬇️ gcloud no encontrado. Iniciando instalación..."
    
    # Instalar dependencias
    sudo apt-get update
    sudo apt-get install -y apt-transport-https ca-certificates gnupg curl

    # Añadir clave GPG
    # Eliminar si existe para evitar conflictos
    sudo rm -f /usr/share/keyrings/cloud.google.gpg
    curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg

    # Añadir repositorio
    echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee /etc/apt/sources.list.d/google-cloud-sdk.list

    # Instalar CLI
    sudo apt-get update
    sudo apt-get install -y google-cloud-cli

    echo "✅ Google Cloud SDK instalado exitosamente."
else
    echo "✅ Google Cloud SDK ya está instalado."
fi
