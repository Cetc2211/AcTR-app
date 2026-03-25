#!/bin/bash
git add GUIA_CONFIGURACION_API_KEYS.md
git commit -m "docs: add comprehensive API keys configuration guide

- Step-by-step guide to create Google Cloud Project
- Instructions to enable required APIs (Vertex AI, Cloud Run, Logging)
- Service Account setup and credential creation
- Environment variables configuration for local and production
- gcloud CLI authentication setup
- Testing procedures to verify everything works
- Troubleshooting section for common issues"
git push origin main
