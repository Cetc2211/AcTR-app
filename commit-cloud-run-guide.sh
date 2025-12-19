#!/bin/bash
git add CONFIGURAR_CLOUD_RUN_PRODUCCION.md
git commit -m "docs: add Cloud Run environment variables configuration guide

- Step-by-step instructions to configure Cloud Run service with required env vars
- Two methods: Google Cloud Console and gcloud CLI
- Lists all required variables: GCP_PROJECT_ID, GCP_REGION, GOOGLE_AI_API_KEY
- Troubleshooting section for common errors
- Security best practices for API key management
- Verification steps to test the configuration"
git push origin main
