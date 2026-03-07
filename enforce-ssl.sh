#!/bin/bash

# Script to enforce SSL/TLS encryption for Cloud SQL connections
# This configures the Cloud SQL instance to require SSL connections

PROJECT_ID="academic-tracker-qeoxi"
REGION="us-central1"
INSTANCE_NAME="ingestion-academic-db"

echo "Configuring Cloud SQL instance to require SSL connections..."

# Enable SSL requirement for the instance
gcloud sql instances patch $INSTANCE_NAME \
  --project=$PROJECT_ID \
  --require-ssl \
  --region=$REGION

if [ $? -eq 0 ]; then
    echo "✅ SSL enforcement configured successfully"
    echo "Note: Instance will restart to apply changes"
    echo "All connections must now use SSL certificates"
else
    echo "❌ Failed to configure SSL enforcement"
    exit 1
fi