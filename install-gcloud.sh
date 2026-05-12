#!/bin/bash
set -e

DISABLED_REPOS=()

disable_problematic_repos() {
    while IFS= read -r repo_file; do
        [ -z "$repo_file" ] && continue
        disabled_file="${repo_file}.disabled-by-install-gcloud"
        echo "⚠️ Deshabilitando temporalmente repo problemático: $repo_file"
        sudo mv "$repo_file" "$disabled_file"
        DISABLED_REPOS+=("$disabled_file")
    done < <(sudo find /etc/apt/sources.list.d -maxdepth 1 \( -name '*.list' -o -name '*.sources' \) -print 2>/dev/null | while read -r file; do
        if sudo grep -qi 'dl.yarnpkg.com/debian' "$file" 2>/dev/null; then
            echo "$file"
        fi
    done)
}

print_disabled_repo_summary() {
    if [ ${#DISABLED_REPOS[@]} -eq 0 ]; then
        return
    fi

    echo ""
    echo "ℹ️ Se deshabilitaron temporalmente repositorios para completar la instalación:"
    for repo in "${DISABLED_REPOS[@]}"; do
        echo "   - $repo"
    done
    echo "   Revísalos después y restáuralos cuando corrijas la llave GPG de Yarn."
}

echo "🔍 Verificando instalación de Google Cloud SDK..."

if ! command -v gcloud &> /dev/null; then
    echo "⬇️ gcloud no encontrado. Iniciando instalación..."

    disable_problematic_repos
    
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
    print_disabled_repo_summary
else
    echo "✅ Google Cloud SDK ya está instalado."
fi
