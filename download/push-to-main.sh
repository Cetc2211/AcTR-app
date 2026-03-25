#!/bin/bash
# Script para hacer push de los cambios a la rama main
# Uso: ./push-to-main.sh <github-repo-url>
# Ejemplo: ./push-to-main.sh https://github.com/usuario/academic-tracker.git

REPO_URL=$1

if [ -z "$REPO_URL" ]; then
    echo "❌ Error: Debes proporcionar el URL del repositorio GitHub"
    echo "Uso: ./push-to-main.sh https://github.com/usuario/repo.git"
    exit 1
fi

# Verificar si el remote ya existe
if git remote | grep -q "origin"; then
    echo "Actualizando remote origin..."
    git remote set-url origin "$REPO_URL"
else
    echo "Agregando remote origin..."
    git remote add origin "$REPO_URL"
fi

# Fetch y checkout a main
echo "Obteniendo cambios remotos..."
git fetch origin

# Crear rama main si no existe
if ! git branch | grep -q "main"; then
    echo "Creando rama main..."
    git checkout -b main
else
    git checkout main
fi

# Merge los cambios de master a main
echo "Mergeando cambios a main..."
git merge master -m "Merge master: sync timeout improvements and debug console"

# Push a main
echo "Haciendo push a origin/main..."
git push origin main

echo "✅ ¡Listo! Los cambios están en main."
