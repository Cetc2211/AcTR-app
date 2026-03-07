#!/bin/bash

# Script to configure max_connections for Cloud SQL micro instance
# Run this after deploying the ingestion service

PROJECT_ID="academic-tracker-qeoxi"
REGION="us-central1"
INSTANCE_NAME="ingestion-academic-db"  # Adjust if different

echo "Configuring max_connections for Cloud SQL instance: $INSTANCE_NAME"

# Set max_connections to 15 for micro instance
gcloud sql instances patch $INSTANCE_NAME \
  --project=$PROJECT_ID \
  --database-flags=max_connections=15 \
  --region=$REGION

if [ $? -eq 0 ]; then
    echo "✅ max_connections set to 15 successfully"
    echo "Note: Instance will restart to apply changes"
else
    echo "❌ Failed to set max_connections"
    exit 1
fi